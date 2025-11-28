import { Link } from "wouter";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-12 pb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">404</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button data-testid="button-go-home">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" data-testid="button-search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
