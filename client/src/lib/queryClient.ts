import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = queryKey[0] as string;
    const pathParams: string[] = [];
    const queryParams: Record<string, string> = {};
    
    for (let i = 1; i < queryKey.length; i++) {
      const param = queryKey[i];
      if (param === undefined || param === null) continue;
      
      if (typeof param === 'object' && param !== null) {
        Object.entries(param).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams[key] = String(value);
          }
        });
      } else if (typeof param === 'number') {
        queryParams['page'] = String(param);
      } else {
        pathParams.push(String(param));
      }
    }
    
    let fullUrl = pathParams.length > 0 ? `${baseUrl}/${pathParams.join("/")}` : baseUrl;
    
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
