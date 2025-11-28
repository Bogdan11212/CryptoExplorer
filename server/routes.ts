import type { Express } from "express";
import { createServer, type Server } from "http";

// API Endpoints
const COINLORE_API = "https://api.coinlore.net/api";
const BLOCKCHAIN_INFO_API = "https://blockchain.info";
const BLOCKCYPHER_API = "https://api.blockcypher.com/v1";
const MEMPOOL_API = "https://mempool.space/api";
const BLOCKCHAIR_API = "https://api.blockchair.com";
const BSC_RPC_API = "https://bsc-rpc.publicnode.com";
const ETH_RPC_API = "https://ethereum-rpc.publicnode.com";
const LITECOIN_SPACE_API = "https://litecoinspace.org/api";
const TRONSCAN_API = "https://apilist.tronscanapi.com/api";
const TONCENTER_API = "https://toncenter.com/api/v2";

const NETWORK_CONFIG: Record<string, { coinloreId: string; blockcypherName?: string; blockchairName?: string }> = {
  btc: { coinloreId: "90", blockcypherName: "btc/main", blockchairName: "bitcoin" },
  eth: { coinloreId: "80", blockcypherName: "eth/main", blockchairName: "ethereum" },
  bnb: { coinloreId: "2710", blockchairName: "bnb" },
  trc20: { coinloreId: "2713", blockchairName: "tron" },
  ton: { coinloreId: "54683" },
  ltc: { coinloreId: "1", blockcypherName: "ltc/main", blockchairName: "litecoin" },
};

async function fetchWithTimeout(url: string, timeout = 8000, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function jsonRpcCall(url: string, method: string, params: any[] = []): Promise<any> {
  const response = await fetchWithTimeout(url, 8000, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  });
  
  if (!response.ok) throw new Error('RPC call failed');
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Market Data API
  app.get("/api/market", async (req, res) => {
    try {
      const coinIds = Object.values(NETWORK_CONFIG).map(c => c.coinloreId).join(",");
      const response = await fetchWithTimeout(`${COINLORE_API}/ticker/?id=${coinIds}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch market data");
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Market data error:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Network Statistics API
  app.get("/api/stats/:network", async (req, res) => {
    try {
      const { network } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use blockchain.info stats
      if (network === "btc") {
        try {
          const [statsRes, blocksRes] = await Promise.all([
            fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/stats?format=json`),
            fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/latestblock`)
          ]);
          
          if (statsRes.ok && blocksRes.ok) {
            const stats = await statsRes.json();
            const latestBlock = await blocksRes.json();
            
            return res.json({
              totalBlocks: latestBlock.height || stats.n_blocks_total,
              totalTransactions: stats.n_tx || 0,
              avgBlockTime: 600,
              difficulty: formatDifficulty(stats.difficulty),
              hashrate: stats.hash_rate ? `${(stats.hash_rate / 1e18).toFixed(2)} EH/s` : null,
              mempoolSize: stats.mempool_transactions || 0,
            });
          }
        } catch (e) {
          console.error("BTC stats error:", e);
        }
      }

      // BNB/BSC - Use JSON-RPC
      if (network === "bnb") {
        try {
          const blockNumber = await jsonRpcCall(BSC_RPC_API, 'eth_blockNumber', []);
          if (!blockNumber) throw new Error("Failed to get block number");
          const block = await jsonRpcCall(BSC_RPC_API, 'eth_getBlockByNumber', [blockNumber, false]);
          
          return res.json({
            totalBlocks: blockNumber ? parseInt(blockNumber, 16) : 0,
            totalTransactions: block?.transactions?.length || 0,
            avgBlockTime: 3,
            difficulty: "N/A",
            hashrate: null,
            mempoolSize: 0,
          });
        } catch (e) {
          console.error("BSC stats error:", e);
        }
      }

      // TRON - Use TronScan API (free, no auth required)
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/block?sort=-number&limit=1`);
          if (response.ok) {
            const data = await response.json();
            const latestBlock = data.data?.[0];
            return res.json({
              totalBlocks: latestBlock?.number || 0,
              totalTransactions: latestBlock?.nrOfTrx || 0,
              avgBlockTime: 3,
              difficulty: "N/A",
              hashrate: null,
              mempoolSize: 0,
            });
          }
        } catch (e) {
          console.error("TRON stats error:", e);
        }
      }

      // TON - Use TonCenter
      if (network === "ton") {
        try {
          const response = await fetchWithTimeout(`${TONCENTER_API}/getMasterchainInfo`);
          if (response.ok) {
            const data = await response.json();
            if (data.ok) {
              return res.json({
                totalBlocks: data.result?.last?.seqno || 0,
                totalTransactions: 0,
                avgBlockTime: 5,
                difficulty: "N/A",
                hashrate: null,
                mempoolSize: 0,
              });
            }
          }
        } catch (e) {
          console.error("TON stats error:", e);
        }
      }

      // ETH - Use PublicNode RPC
      if (network === "eth") {
        try {
          const blockNumber = await jsonRpcCall(ETH_RPC_API, 'eth_blockNumber', []);
          if (blockNumber) {
            const block = await jsonRpcCall(ETH_RPC_API, 'eth_getBlockByNumber', [blockNumber, false]);
            return res.json({
              totalBlocks: parseInt(blockNumber, 16),
              totalTransactions: block?.transactions?.length || 0,
              avgBlockTime: 12,
              difficulty: "N/A (PoS)",
              hashrate: null,
              mempoolSize: 0,
            });
          }
        } catch (e) {
          console.error("ETH stats error:", e);
        }
      }

      // LTC - Use Litecoin Space API
      if (network === "ltc") {
        try {
          const response = await fetchWithTimeout(`${LITECOIN_SPACE_API}/v1/blocks`);
          if (response.ok) {
            const blocks = await response.json();
            const latestBlock = blocks[0];
            return res.json({
              totalBlocks: latestBlock?.height || 0,
              totalTransactions: latestBlock?.tx_count || 0,
              avgBlockTime: 150,
              difficulty: latestBlock?.difficulty ? formatDifficulty(latestBlock.difficulty) : "N/A",
              hashrate: null,
              mempoolSize: 0,
            });
          }
        } catch (e) {
          console.error("LTC stats error:", e);
        }
      }

      res.status(503).json({ error: "Unable to fetch network statistics" });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch network statistics" });
    }
  });

  // Blocks API
  app.get("/api/blocks/:network", async (req, res) => {
    try {
      const { network } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use Mempool.space for real-time blocks
      if (network === "btc") {
        try {
          const response = await fetchWithTimeout(`${MEMPOOL_API}/v1/blocks`);
          if (response.ok) {
            const blocks = await response.json();
            const formattedBlocks = blocks.slice(0, 10).map((block: any) => ({
              height: block.height,
              hash: block.id,
              time: new Date(block.timestamp * 1000).toISOString(),
              transactionCount: block.tx_count,
              size: block.size,
              miner: block.extras?.pool?.name || null,
              reward: "3.125",
              difficulty: formatDifficulty(block.difficulty),
              nonce: block.nonce?.toString(),
              merkleRoot: block.merkle_root,
            }));
            return res.json(formattedBlocks);
          }
        } catch (e) {
          console.error("Mempool blocks error:", e);
        }
        
        // Fallback to blockchain.info
        try {
          const latestBlockRes = await fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/latestblock`);
          if (latestBlockRes.ok) {
            const latestBlock = await latestBlockRes.json();
            const blocksPromises = [];
            for (let i = 0; i < 10; i++) {
              const height = latestBlock.height - i;
              blocksPromises.push(
                fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/block-height/${height}?format=json`)
                  .then(r => r.ok ? r.json() : null)
                  .catch(() => null)
              );
            }
            
            const blocksData = await Promise.all(blocksPromises);
            const blocks = blocksData
              .filter(d => d && d.blocks && d.blocks[0])
              .map(d => {
                const block = d.blocks[0];
                return {
                  height: block.height,
                  hash: block.hash,
                  time: new Date(block.time * 1000).toISOString(),
                  transactionCount: block.n_tx,
                  size: block.size,
                  miner: block.relayed_by || null,
                  reward: "3.125",
                  difficulty: block.difficulty ? formatDifficulty(block.difficulty) : null,
                  nonce: block.nonce?.toString(),
                  merkleRoot: block.mrkl_root,
                };
              });
            
            if (blocks.length > 0) {
              return res.json(blocks);
            }
          }
        } catch (e) {
          console.error("Blockchain.info blocks error:", e);
        }
      }

      // ETH - Use PublicNode RPC
      if (network === "eth") {
        try {
          const blockNumber = await jsonRpcCall(ETH_RPC_API, 'eth_blockNumber', []);
          if (blockNumber) {
            const currentBlock = parseInt(blockNumber, 16);
            
            const blockPromises = [];
            for (let i = 0; i < 10; i++) {
              const blockHex = '0x' + (currentBlock - i).toString(16);
              blockPromises.push(
                jsonRpcCall(ETH_RPC_API, 'eth_getBlockByNumber', [blockHex, false])
                  .catch(() => null)
              );
            }
            
            const blocksData = await Promise.all(blockPromises);
            const blocks = blocksData
              .filter(b => b && b.number && b.hash && b.timestamp)
              .map(block => ({
                height: block.number ? parseInt(block.number, 16) : 0,
                hash: block.hash || "",
                time: block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
                transactionCount: block.transactions?.length || 0,
                size: block.size ? parseInt(block.size, 16) : 0,
                miner: block.miner || null,
                reward: "0",
                difficulty: "N/A (PoS)",
                nonce: block.nonce || null,
                merkleRoot: block.transactionsRoot || null,
              }));
            
            if (blocks.length > 0) {
              return res.json(blocks);
            }
          }
        } catch (e) {
          console.error("ETH RPC blocks error:", e);
        }
      }

      // BNB/BSC - Use JSON-RPC
      if (network === "bnb") {
        try {
          const blockNumber = await jsonRpcCall(BSC_RPC_API, 'eth_blockNumber', []);
          if (!blockNumber) throw new Error("Failed to get block number");
          const currentBlock = parseInt(blockNumber, 16);
          
          const blockPromises = [];
          for (let i = 0; i < 10; i++) {
            const blockHex = '0x' + (currentBlock - i).toString(16);
            blockPromises.push(
              jsonRpcCall(BSC_RPC_API, 'eth_getBlockByNumber', [blockHex, false])
                .catch(() => null)
            );
          }
          
          const blocksData = await Promise.all(blockPromises);
          const blocks = blocksData
            .filter(b => b && b.number && b.hash && b.timestamp)
            .map(block => ({
              height: block.number ? parseInt(block.number, 16) : 0,
              hash: block.hash || "",
              time: block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
              transactionCount: block.transactions?.length || 0,
              size: block.size ? parseInt(block.size, 16) : 0,
              miner: block.miner || null,
              reward: "0",
              difficulty: block.difficulty ? parseInt(block.difficulty, 16).toString() : "0",
              nonce: block.nonce || null,
              merkleRoot: block.transactionsRoot || null,
            }));
          
          if (blocks.length > 0) {
            return res.json(blocks);
          }
        } catch (e) {
          console.error("BSC blocks error:", e);
        }
      }

      // TRON - Use TronScan API (free, no auth required)
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/block?sort=-number&limit=10`);
          if (response.ok) {
            const data = await response.json();
            const blocks = (data.data || []).map((block: any) => ({
              height: block.number,
              hash: block.hash,
              time: new Date(block.timestamp).toISOString(),
              transactionCount: block.nrOfTrx || 0,
              size: block.size || 0,
              miner: block.witnessAddress,
              reward: (block.blockReward || 0).toString(),
              difficulty: "N/A",
              nonce: null,
              merkleRoot: null,
            }));
            
            if (blocks.length > 0) {
              return res.json(blocks);
            }
          }
        } catch (e) {
          console.error("TRON blocks error:", e);
        }
      }

      // TON - Use TonCenter
      if (network === "ton") {
        try {
          const response = await fetchWithTimeout(`${TONCENTER_API}/getMasterchainInfo`);
          if (response.ok) {
            const data = await response.json();
            if (data.ok && data.result) {
              const lastSeqno = data.result.last.seqno;
              
              const blockPromises = [];
              for (let i = 0; i < 10; i++) {
                const seqno = lastSeqno - i;
                if (seqno > 0) {
                  blockPromises.push(
                    fetchWithTimeout(`${TONCENTER_API}/getBlockHeader?workchain=-1&shard=-9223372036854775808&seqno=${seqno}`)
                      .then(r => r.ok ? r.json() : null)
                      .catch(() => null)
                  );
                }
              }
              
              const blocksData = await Promise.all(blockPromises);
              const blocks = blocksData
                .filter(b => b && b.ok && b.result)
                .map(b => {
                  const block = b.result;
                  const timestamp = block.gen_utime ? block.gen_utime * 1000 : Date.now();
                  return {
                    height: block.id?.seqno || 0,
                    hash: block.id?.root_hash || "",
                    time: new Date(timestamp).toISOString(),
                    transactionCount: 0,
                    size: 0,
                    miner: null,
                    reward: "0",
                    difficulty: "N/A",
                    nonce: null,
                    merkleRoot: null,
                  };
                });
              
              if (blocks.length > 0) {
                return res.json(blocks);
              }
            }
          }
        } catch (e) {
          console.error("TON blocks error:", e);
        }
      }

      // LTC - Use Litecoin Space API
      if (network === "ltc") {
        try {
          const response = await fetchWithTimeout(`${LITECOIN_SPACE_API}/v1/blocks`);
          if (response.ok) {
            const blocksData = await response.json();
            const blocks = blocksData.slice(0, 10).map((block: any) => ({
              height: block.height,
              hash: block.id,
              time: new Date(block.timestamp * 1000).toISOString(),
              transactionCount: block.tx_count,
              size: block.size,
              miner: block.extras?.pool?.name || null,
              reward: (block.extras?.reward / 1e8 || 6.25).toFixed(4),
              difficulty: block.difficulty ? formatDifficulty(block.difficulty) : null,
              nonce: block.nonce?.toString(),
              merkleRoot: block.merkle_root,
            }));
            
            if (blocks.length > 0) {
              return res.json(blocks);
            }
          }
        } catch (e) {
          console.error("Litecoin Space blocks error:", e);
        }
      }

      res.status(503).json({ error: "Unable to fetch blocks" });
    } catch (error) {
      console.error("Blocks error:", error);
      res.status(500).json({ error: "Failed to fetch blocks" });
    }
  });

  // Single Block Details API
  app.get("/api/block/:network/:blockId", async (req, res) => {
    try {
      const { network, blockId } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use Mempool.space
      if (network === "btc") {
        try {
          // Try by height first
          const heightResponse = await fetchWithTimeout(`${MEMPOOL_API}/block-height/${blockId}`);
          if (heightResponse.ok) {
            const blockHash = await heightResponse.text();
            const blockResponse = await fetchWithTimeout(`${MEMPOOL_API}/block/${blockHash}`);
            if (blockResponse.ok) {
              const block = await blockResponse.json();
              return res.json({
                height: block.height,
                hash: block.id,
                time: new Date(block.timestamp * 1000).toISOString(),
                transactionCount: block.tx_count,
                size: block.size,
                miner: block.extras?.pool?.name || null,
                reward: "3.125",
                difficulty: formatDifficulty(block.difficulty),
                nonce: block.nonce?.toString(),
                merkleRoot: block.merkle_root,
              });
            }
          }
        } catch (e) {
          console.error("Mempool block error:", e);
        }
        
        // Fallback to blockchain.info
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/block-height/${blockId}?format=json`);
          if (response.ok) {
            const data = await response.json();
            const block = data.blocks?.[0];
            if (block) {
              return res.json({
                height: block.height,
                hash: block.hash,
                time: new Date(block.time * 1000).toISOString(),
                transactionCount: block.n_tx,
                size: block.size,
                miner: block.relayed_by || null,
                reward: "3.125",
                difficulty: block.difficulty?.toString() || null,
                nonce: block.nonce?.toString(),
                merkleRoot: block.mrkl_root,
              });
            }
          }
        } catch (e) {
          console.error("Blockchain.info block error:", e);
        }
      }

      // ETH - Use PublicNode RPC
      if (network === "eth") {
        try {
          const blockHex = '0x' + parseInt(blockId).toString(16);
          const block = await jsonRpcCall(ETH_RPC_API, 'eth_getBlockByNumber', [blockHex, false]);
          if (block && block.number && block.hash) {
            return res.json({
              height: parseInt(block.number, 16),
              hash: block.hash,
              time: block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
              transactionCount: block.transactions?.length || 0,
              size: block.size ? parseInt(block.size, 16) : 0,
              miner: block.miner || null,
              reward: "0",
              difficulty: "N/A (PoS)",
              nonce: block.nonce || null,
              merkleRoot: block.transactionsRoot || null,
            });
          }
        } catch (e) {
          console.error("ETH RPC block error:", e);
        }
      }

      // BNB/BSC - Use JSON-RPC
      if (network === "bnb") {
        try {
          const blockHex = '0x' + parseInt(blockId).toString(16);
          const block = await jsonRpcCall(BSC_RPC_API, 'eth_getBlockByNumber', [blockHex, false]);
          if (block && block.number && block.hash) {
            return res.json({
              height: block.number ? parseInt(block.number, 16) : 0,
              hash: block.hash || "",
              time: block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
              transactionCount: block.transactions?.length || 0,
              size: block.size ? parseInt(block.size, 16) : 0,
              miner: block.miner || null,
              reward: "0",
              difficulty: block.difficulty ? parseInt(block.difficulty, 16).toString() : "0",
              nonce: block.nonce || null,
              merkleRoot: block.transactionsRoot || null,
            });
          }
        } catch (e) {
          console.error("BSC block error:", e);
        }
      }

      // TRON - Use TronScan API
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/block?number=${blockId}`);
          if (response.ok) {
            const data = await response.json();
            const block = data.data?.[0];
            if (block) {
              return res.json({
                height: block.number,
                hash: block.hash,
                time: new Date(block.timestamp).toISOString(),
                transactionCount: block.nrOfTrx || 0,
                size: block.size || 0,
                miner: block.witnessAddress,
                reward: (block.blockReward || 0).toString(),
                difficulty: "N/A",
                nonce: null,
                merkleRoot: null,
              });
            }
          }
        } catch (e) {
          console.error("TRON block error:", e);
        }
      }

      // TON - Use TonCenter
      if (network === "ton") {
        try {
          const response = await fetchWithTimeout(`${TONCENTER_API}/getBlockHeader?workchain=-1&shard=-9223372036854775808&seqno=${blockId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.ok && data.result) {
              const block = data.result;
              const timestamp = block.gen_utime ? block.gen_utime * 1000 : Date.now();
              return res.json({
                height: block.id?.seqno || parseInt(blockId),
                hash: block.id?.root_hash || "",
                time: new Date(timestamp).toISOString(),
                transactionCount: 0,
                size: 0,
                miner: null,
                reward: "0",
                difficulty: "N/A",
                nonce: null,
                merkleRoot: null,
              });
            }
          }
        } catch (e) {
          console.error("TON block error:", e);
        }
      }

      // LTC - Use Litecoin Space API
      if (network === "ltc") {
        try {
          const response = await fetchWithTimeout(`${LITECOIN_SPACE_API}/block-height/${blockId}`);
          if (response.ok) {
            const blockHash = await response.text();
            const blockResponse = await fetchWithTimeout(`${LITECOIN_SPACE_API}/block/${blockHash}`);
            if (blockResponse.ok) {
              const block = await blockResponse.json();
              return res.json({
                height: block.height,
                hash: block.id,
                time: new Date(block.timestamp * 1000).toISOString(),
                transactionCount: block.tx_count,
                size: block.size,
                miner: block.extras?.pool?.name || null,
                reward: (block.extras?.reward / 1e8 || 6.25).toFixed(4),
                difficulty: block.difficulty ? formatDifficulty(block.difficulty) : null,
                nonce: block.nonce?.toString(),
                merkleRoot: block.merkle_root,
              });
            }
          }
        } catch (e) {
          console.error("Litecoin Space block error:", e);
        }
      }

      res.status(404).json({ error: "Block not found" });
    } catch (error) {
      console.error("Block detail error:", error);
      res.status(500).json({ error: "Failed to fetch block details" });
    }
  });

  // Block Transactions API
  app.get("/api/block/:network/:blockId/transactions", async (req, res) => {
    try {
      const { network, blockId } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use Mempool.space
      if (network === "btc") {
        try {
          const heightResponse = await fetchWithTimeout(`${MEMPOOL_API}/block-height/${blockId}`);
          if (heightResponse.ok) {
            const blockHash = await heightResponse.text();
            const txsResponse = await fetchWithTimeout(`${MEMPOOL_API}/block/${blockHash}/txs`);
            if (txsResponse.ok) {
              const txs = await txsResponse.json();
              const formattedTxs = txs.slice(0, 20).map((tx: any) => ({
                hash: tx.txid,
                blockHeight: parseInt(blockId),
                time: new Date(tx.status.block_time * 1000).toISOString(),
                from: tx.vin?.map((v: any) => v.prevout?.scriptpubkey_address).filter(Boolean) || ["Coinbase"],
                to: tx.vout?.map((v: any) => v.scriptpubkey_address).filter(Boolean) || [],
                value: `${(tx.vout?.reduce((sum: number, v: any) => sum + (v.value || 0), 0) || 0) / 1e8}`,
                fee: `${(tx.fee || 0) / 1e8}`,
                confirmations: 6,
                status: "confirmed" as const,
                inputCount: tx.vin?.length || 0,
                outputCount: tx.vout?.length || 0,
              }));
              return res.json(formattedTxs);
            }
          }
        } catch (e) {
          console.error("Mempool block txs error:", e);
        }
        
        // Fallback to blockchain.info
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/block-height/${blockId}?format=json`);
          if (response.ok) {
            const data = await response.json();
            const block = data.blocks?.[0];
            if (block && block.tx) {
              const txs = block.tx.slice(0, 20).map((tx: any) => ({
                hash: tx.hash,
                blockHeight: block.height,
                time: new Date(tx.time * 1000).toISOString(),
                from: tx.inputs?.map((i: any) => i.prev_out?.addr).filter(Boolean) || ["Coinbase"],
                to: tx.out?.map((o: any) => o.addr).filter(Boolean) || [],
                value: `${(tx.out?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || 0) / 1e8}`,
                fee: `${(tx.fee || 0) / 1e8}`,
                confirmations: 6,
                status: "confirmed" as const,
                inputCount: tx.vin_sz,
                outputCount: tx.vout_sz,
              }));
              return res.json(txs);
            }
          }
        } catch (e) {
          console.error("Blockchain.info block txs error:", e);
        }
      }

      // ETH - Use PublicNode RPC
      if (network === "eth") {
        try {
          const blockHex = '0x' + parseInt(blockId).toString(16);
          const block = await jsonRpcCall(ETH_RPC_API, 'eth_getBlockByNumber', [blockHex, true]);
          if (block && block.transactions && block.timestamp) {
            const txs = block.transactions.slice(0, 20).map((tx: any) => ({
              hash: tx.hash || "",
              blockHeight: tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0,
              time: block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
              from: [tx.from || "Unknown"],
              to: tx.to ? [tx.to] : ["Contract Creation"],
              value: `${tx.value ? parseInt(tx.value, 16) / 1e18 : 0}`,
              fee: `${tx.gas && tx.gasPrice ? (parseInt(tx.gas, 16) * parseInt(tx.gasPrice, 16)) / 1e18 : 0}`,
              confirmations: 6,
              status: "confirmed" as const,
              inputCount: 1,
              outputCount: 1,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("ETH RPC block txs error:", e);
        }
      }

      // BNB/BSC - Use JSON-RPC
      if (network === "bnb") {
        try {
          const blockHex = '0x' + parseInt(blockId).toString(16);
          const block = await jsonRpcCall(BSC_RPC_API, 'eth_getBlockByNumber', [blockHex, true]);
          if (block && block.transactions && block.timestamp) {
            const txs = block.transactions.slice(0, 20).map((tx: any) => ({
              hash: tx.hash || "",
              blockHeight: tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0,
              time: block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
              from: [tx.from || "Unknown"],
              to: tx.to ? [tx.to] : ["Contract Creation"],
              value: `${tx.value ? parseInt(tx.value, 16) / 1e18 : 0}`,
              fee: `${tx.gas && tx.gasPrice ? (parseInt(tx.gas, 16) * parseInt(tx.gasPrice, 16)) / 1e18 : 0}`,
              confirmations: 6,
              status: "confirmed" as const,
              inputCount: 1,
              outputCount: 1,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("BSC block txs error:", e);
        }
      }

      // TRON - Use TronScan API
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/transaction?block=${blockId}&limit=20`);
          if (response.ok) {
            const data = await response.json();
            const txs = (data.data || []).map((tx: any) => ({
              hash: tx.hash,
              blockHeight: tx.block || parseInt(blockId),
              time: new Date(tx.timestamp).toISOString(),
              from: [tx.ownerAddress || "Unknown"],
              to: [tx.toAddress || tx.toAddressList?.[0] || "Unknown"],
              value: `${(tx.amount || tx.contractData?.amount || 0) / 1e6}`,
              fee: `${(tx.fee || 0) / 1e6}`,
              confirmations: tx.confirmed ? 6 : 0,
              status: tx.confirmed ? "confirmed" as const : "pending" as const,
              inputCount: 1,
              outputCount: 1,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("TRON block txs error:", e);
        }
      }

      // LTC - Use BlockCypher
      if (network === "ltc" && config.blockcypherName) {
        try {
          const response = await fetchWithTimeout(`${BLOCKCYPHER_API}/${config.blockcypherName}/blocks/${blockId}?limit=20&txstart=0`);
          if (response.ok) {
            const block = await response.json();
            if (block.txids) {
              const txPromises = block.txids.slice(0, 10).map((txid: string) =>
                fetchWithTimeout(`${BLOCKCYPHER_API}/${config.blockcypherName}/txs/${txid}`)
                  .then(r => r.ok ? r.json() : null)
                  .catch(() => null)
              );
              const txsData = await Promise.all(txPromises);
              const txs = txsData.filter(tx => tx).map((tx: any) => ({
                hash: tx.hash,
                blockHeight: tx.block_height,
                time: tx.received || tx.confirmed,
                from: tx.inputs?.map((i: any) => i.addresses?.[0]).filter(Boolean) || [],
                to: tx.outputs?.map((o: any) => o.addresses?.[0]).filter(Boolean) || [],
                value: `${(tx.total || 0) / 1e8}`,
                fee: `${(tx.fees || 0) / 1e8}`,
                confirmations: tx.confirmations || 0,
                status: tx.confirmations > 0 ? "confirmed" as const : "pending" as const,
                inputCount: tx.inputs?.length || 0,
                outputCount: tx.outputs?.length || 0,
              }));
              return res.json(txs);
            }
          }
        } catch (e) {
          console.error("BlockCypher LTC block txs error:", e);
        }
      }

      res.json([]);
    } catch (error) {
      console.error("Block transactions error:", error);
      res.json([]);
    }
  });

  // Recent Transactions API
  app.get("/api/transactions/:network", async (req, res) => {
    try {
      const { network } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use Mempool.space for recent transactions
      if (network === "btc") {
        try {
          const response = await fetchWithTimeout(`${MEMPOOL_API}/mempool/recent`);
          if (response.ok) {
            const txs = await response.json();
            const formattedTxs = txs.slice(0, 20).map((tx: any) => ({
              hash: tx.txid,
              blockHeight: 0,
              time: new Date().toISOString(),
              from: ["Pending..."],
              to: ["Pending..."],
              value: `${(tx.value || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: 0,
              status: "pending" as const,
              inputCount: 1,
              outputCount: 1,
            }));
            return res.json(formattedTxs);
          }
        } catch (e) {
          console.error("Mempool recent txs error:", e);
        }
        
        // Fallback to blockchain.info
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/unconfirmed-transactions?format=json`);
          if (response.ok) {
            const data = await response.json();
            const txs = (data.txs || []).slice(0, 20).map((tx: any) => ({
              hash: tx.hash,
              blockHeight: tx.block_height || 0,
              time: new Date(tx.time * 1000).toISOString(),
              from: tx.inputs?.map((i: any) => i.prev_out?.addr).filter(Boolean) || ["Unknown"],
              to: tx.out?.map((o: any) => o.addr).filter(Boolean) || ["Unknown"],
              value: `${(tx.out?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: tx.block_height ? 6 : 0,
              status: tx.block_height ? "confirmed" as const : "pending" as const,
              inputCount: tx.vin_sz,
              outputCount: tx.vout_sz,
            }));
            if (txs.length > 0) {
              return res.json(txs);
            }
          }
        } catch (e) {
          console.error("Blockchain.info txs error:", e);
        }
      }

      // ETH - Use Blockchair for recent transactions
      if (network === "eth" && config.blockchairName) {
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIR_API}/${config.blockchairName}/transactions?limit=20`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              const txs = data.data.map((tx: any) => ({
                hash: tx.hash,
                blockHeight: tx.block_id,
                time: tx.time,
                from: [tx.sender],
                to: [tx.recipient],
                value: `${(tx.value || 0) / 1e18}`,
                fee: `${(tx.fee || 0) / 1e18}`,
                confirmations: 6,
                status: "confirmed" as const,
                inputCount: 1,
                outputCount: 1,
              }));
              return res.json(txs);
            }
          }
        } catch (e) {
          console.error("Blockchair ETH txs error:", e);
        }
      }

      // BNB/BSC - Get transactions from latest block
      if (network === "bnb") {
        try {
          const blockNumber = await jsonRpcCall(BSC_RPC_API, 'eth_blockNumber', []);
          if (!blockNumber) throw new Error("Failed to get block number");
          const block = await jsonRpcCall(BSC_RPC_API, 'eth_getBlockByNumber', [blockNumber, true]);
          if (block && block.transactions && block.timestamp) {
            const txs = block.transactions.slice(0, 20).map((tx: any) => ({
              hash: tx.hash || "",
              blockHeight: tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0,
              time: block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
              from: [tx.from || "Unknown"],
              to: tx.to ? [tx.to] : ["Contract Creation"],
              value: `${tx.value ? parseInt(tx.value, 16) / 1e18 : 0}`,
              fee: `${tx.gas && tx.gasPrice ? (parseInt(tx.gas, 16) * parseInt(tx.gasPrice, 16)) / 1e18 : 0}`,
              confirmations: 0,
              status: "confirmed" as const,
              inputCount: 1,
              outputCount: 1,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("BSC txs error:", e);
        }
      }

      // TRON - Use TronScan API
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/transaction?sort=-timestamp&limit=20`);
          if (response.ok) {
            const data = await response.json();
            const txs = (data.data || []).map((tx: any) => ({
              hash: tx.hash,
              blockHeight: tx.block || 0,
              time: new Date(tx.timestamp).toISOString(),
              from: [tx.ownerAddress || "Unknown"],
              to: [tx.toAddress || tx.toAddressList?.[0] || "Unknown"],
              value: `${(tx.amount || tx.contractData?.amount || 0) / 1e6}`,
              fee: `${(tx.fee || 0) / 1e6}`,
              confirmations: tx.confirmed ? 6 : 0,
              status: tx.confirmed ? "confirmed" as const : "pending" as const,
              inputCount: 1,
              outputCount: 1,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("TRON txs error:", e);
        }
      }

      // TON - Use TonCenter (rate limited, returns recent transactions from masterchain)
      if (network === "ton") {
        try {
          const infoRes = await fetchWithTimeout(`${TONCENTER_API}/getMasterchainInfo`);
          if (infoRes.ok) {
            const info = await infoRes.json();
            if (info.ok && info.result) {
              return res.json([]);
            }
          }
        } catch (e) {
          console.error("TON txs error:", e);
          return res.status(503).json({ error: "TON API unavailable" });
        }
      }

      // LTC - Use Litecoin Space API (mempool transactions)
      if (network === "ltc") {
        try {
          const response = await fetchWithTimeout(`${LITECOIN_SPACE_API}/mempool/recent`);
          if (response.ok) {
            const txsData = await response.json();
            const txs = txsData.slice(0, 20).map((tx: any) => ({
              hash: tx.txid,
              blockHeight: 0,
              time: new Date().toISOString(),
              from: [],
              to: [],
              value: `${(tx.value || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: 0,
              status: "pending" as const,
              inputCount: tx.vin?.length || 0,
              outputCount: tx.vout?.length || 0,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("Litecoin Space txs error:", e);
          return res.status(503).json({ error: "Litecoin API unavailable" });
        }
      }

      return res.status(404).json({ error: "No transactions found" });
    } catch (error) {
      console.error("Transactions error:", error);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Single Transaction Details API
  app.get("/api/transaction/:network/:txHash", async (req, res) => {
    try {
      const { network, txHash } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use Mempool.space
      if (network === "btc") {
        try {
          const response = await fetchWithTimeout(`${MEMPOOL_API}/tx/${txHash}`);
          if (response.ok) {
            const tx = await response.json();
            return res.json({
              hash: tx.txid,
              blockHeight: tx.status?.block_height || 0,
              time: tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString() : new Date().toISOString(),
              from: tx.vin?.map((v: any) => v.prevout?.scriptpubkey_address).filter(Boolean) || ["Coinbase"],
              to: tx.vout?.map((v: any) => v.scriptpubkey_address).filter(Boolean) || [],
              value: `${(tx.vout?.reduce((sum: number, v: any) => sum + (v.value || 0), 0) || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: tx.status?.confirmed ? 6 : 0,
              status: tx.status?.confirmed ? "confirmed" as const : "pending" as const,
              inputCount: tx.vin?.length || 0,
              outputCount: tx.vout?.length || 0,
            });
          }
        } catch (e) {
          console.error("Mempool tx error:", e);
        }
        
        // Fallback to blockchain.info
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/rawtx/${txHash}`);
          if (response.ok) {
            const tx = await response.json();
            return res.json({
              hash: tx.hash,
              blockHeight: tx.block_height || 0,
              time: new Date(tx.time * 1000).toISOString(),
              from: tx.inputs?.map((i: any) => i.prev_out?.addr).filter(Boolean) || ["Coinbase"],
              to: tx.out?.map((o: any) => o.addr).filter(Boolean) || [],
              value: `${(tx.out?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: tx.block_height ? 6 : 0,
              status: tx.block_height ? "confirmed" as const : "pending" as const,
              inputCount: tx.vin_sz,
              outputCount: tx.vout_sz,
            });
          }
        } catch (e) {
          console.error("Blockchain.info tx error:", e);
        }
      }

      // ETH - Use Blockchair or BlockCypher
      if (network === "eth") {
        if (config.blockchairName) {
          try {
            const response = await fetchWithTimeout(`${BLOCKCHAIR_API}/${config.blockchairName}/dashboards/transaction/${txHash}`);
            if (response.ok) {
              const data = await response.json();
              const tx = data.data?.[txHash]?.transaction;
              if (tx) {
                return res.json({
                  hash: tx.hash,
                  blockHeight: tx.block_id,
                  time: tx.time,
                  from: [tx.sender],
                  to: [tx.recipient],
                  value: `${(tx.value || 0) / 1e18}`,
                  fee: `${(tx.fee || 0) / 1e18}`,
                  confirmations: 6,
                  status: "confirmed" as const,
                  inputCount: 1,
                  outputCount: 1,
                });
              }
            }
          } catch (e) {
            console.error("Blockchair ETH tx error:", e);
          }
        }
        
        if (config.blockcypherName) {
          try {
            const response = await fetchWithTimeout(`${BLOCKCYPHER_API}/${config.blockcypherName}/txs/${txHash}`);
            if (response.ok) {
              const tx = await response.json();
              return res.json({
                hash: tx.hash,
                blockHeight: tx.block_height || 0,
                time: tx.received || new Date().toISOString(),
                from: tx.inputs?.map((i: any) => i.addresses?.[0]).filter(Boolean) || [],
                to: tx.outputs?.map((o: any) => o.addresses?.[0]).filter(Boolean) || [],
                value: `${(tx.total || 0) / 1e18}`,
                fee: `${(tx.fees || 0) / 1e18}`,
                confirmations: tx.confirmations || 0,
                status: tx.confirmations > 0 ? "confirmed" as const : "pending" as const,
                inputCount: tx.inputs?.length || 0,
                outputCount: tx.outputs?.length || 0,
              });
            }
          } catch (e) {
            console.error("BlockCypher ETH tx error:", e);
          }
        }
      }

      // BNB/BSC - Use JSON-RPC
      if (network === "bnb") {
        try {
          const tx = await jsonRpcCall(BSC_RPC_API, 'eth_getTransactionByHash', [txHash]);
          if (tx && tx.hash) {
            const receipt = await jsonRpcCall(BSC_RPC_API, 'eth_getTransactionReceipt', [txHash]).catch(() => null);
            const block = tx.blockNumber ? 
              await jsonRpcCall(BSC_RPC_API, 'eth_getBlockByNumber', [tx.blockNumber, false]).catch(() => null) : null;
            
            return res.json({
              hash: tx.hash || "",
              blockHeight: tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0,
              time: block && block.timestamp ? new Date(parseInt(block.timestamp, 16) * 1000).toISOString() : new Date().toISOString(),
              from: [tx.from || "Unknown"],
              to: tx.to ? [tx.to] : ["Contract Creation"],
              value: `${tx.value ? parseInt(tx.value, 16) / 1e18 : 0}`,
              fee: receipt && receipt.gasUsed && tx.gasPrice ? `${(parseInt(receipt.gasUsed, 16) * parseInt(tx.gasPrice, 16)) / 1e18}` : "0",
              confirmations: tx.blockNumber ? 6 : 0,
              status: tx.blockNumber ? "confirmed" as const : "pending" as const,
              inputCount: 1,
              outputCount: 1,
            });
          }
        } catch (e) {
          console.error("BSC tx error:", e);
        }
      }

      // TRON - Use TronScan API
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/transaction-info?hash=${txHash}`);
          if (response.ok) {
            const tx = await response.json();
            if (tx.hash) {
              return res.json({
                hash: tx.hash,
                blockHeight: tx.block || 0,
                time: new Date(tx.timestamp).toISOString(),
                from: [tx.ownerAddress || "Unknown"],
                to: [tx.toAddress || tx.contractData?.to_address || "Unknown"],
                value: `${(tx.contractData?.amount || tx.amount || 0) / 1e6}`,
                fee: `${(tx.fee || 0) / 1e6}`,
                confirmations: tx.confirmed ? 6 : 0,
                status: tx.confirmed ? "confirmed" as const : "pending" as const,
                inputCount: 1,
                outputCount: 1,
              });
            }
          }
        } catch (e) {
          console.error("TRON tx error:", e);
        }
      }

      // LTC - Use BlockCypher
      if (network === "ltc" && config.blockcypherName) {
        try {
          const response = await fetchWithTimeout(`${BLOCKCYPHER_API}/${config.blockcypherName}/txs/${txHash}`);
          if (response.ok) {
            const tx = await response.json();
            return res.json({
              hash: tx.hash,
              blockHeight: tx.block_height || 0,
              time: tx.received || new Date().toISOString(),
              from: tx.inputs?.map((i: any) => i.addresses?.[0]).filter(Boolean) || [],
              to: tx.outputs?.map((o: any) => o.addresses?.[0]).filter(Boolean) || [],
              value: `${(tx.total || 0) / 1e8}`,
              fee: `${(tx.fees || 0) / 1e8}`,
              confirmations: tx.confirmations || 0,
              status: tx.confirmations > 0 ? "confirmed" as const : "pending" as const,
              inputCount: tx.inputs?.length || 0,
              outputCount: tx.outputs?.length || 0,
            });
          }
        } catch (e) {
          console.error("BlockCypher LTC tx error:", e);
        }
      }

      res.status(404).json({ error: "Transaction not found" });
    } catch (error) {
      console.error("Transaction detail error:", error);
      res.status(500).json({ error: "Failed to fetch transaction details" });
    }
  });

  // Wallet/Address Details API
  app.get("/api/wallet/:network/:address", async (req, res) => {
    try {
      const { network, address } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use Mempool.space or blockchain.info
      if (network === "btc") {
        try {
          const response = await fetchWithTimeout(`${MEMPOOL_API}/address/${address}`);
          if (response.ok) {
            const data = await response.json();
            return res.json({
              address: address,
              balance: `${((data.chain_stats?.funded_txo_sum || 0) - (data.chain_stats?.spent_txo_sum || 0)) / 1e8}`,
              balanceUsd: null,
              transactionCount: (data.chain_stats?.tx_count || 0) + (data.mempool_stats?.tx_count || 0),
              firstSeen: null,
              lastSeen: null,
              received: `${(data.chain_stats?.funded_txo_sum || 0) / 1e8}`,
              sent: `${(data.chain_stats?.spent_txo_sum || 0) / 1e8}`,
              tokens: [],
              nfts: [],
            });
          }
        } catch (e) {
          console.error("Mempool address error:", e);
        }
        
        // Fallback to blockchain.info
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/rawaddr/${address}?limit=0`);
          if (response.ok) {
            const data = await response.json();
            return res.json({
              address: data.address,
              balance: `${(data.final_balance || 0) / 1e8}`,
              balanceUsd: null,
              transactionCount: data.n_tx || 0,
              firstSeen: null,
              lastSeen: null,
              received: `${(data.total_received || 0) / 1e8}`,
              sent: `${(data.total_sent || 0) / 1e8}`,
              tokens: [],
              nfts: [],
            });
          }
        } catch (e) {
          console.error("Blockchain.info wallet error:", e);
        }
      }

      // ETH - Use Blockchair or BlockCypher
      if (network === "eth") {
        if (config.blockchairName) {
          try {
            const response = await fetchWithTimeout(`${BLOCKCHAIR_API}/${config.blockchairName}/dashboards/address/${address}`);
            if (response.ok) {
              const data = await response.json();
              const addressData = data.data?.[address.toLowerCase()]?.address;
              if (addressData) {
                return res.json({
                  address: address,
                  balance: `${(addressData.balance || 0) / 1e18}`,
                  balanceUsd: addressData.balance_usd ? `${addressData.balance_usd.toFixed(2)}` : null,
                  transactionCount: addressData.transaction_count || 0,
                  firstSeen: addressData.first_seen_receiving,
                  lastSeen: addressData.last_seen_receiving,
                  received: `${(addressData.received || 0) / 1e18}`,
                  sent: `${(addressData.spent || 0) / 1e18}`,
                  tokens: [],
                  nfts: [],
                });
              }
            }
          } catch (e) {
            console.error("Blockchair ETH wallet error:", e);
          }
        }
        
        if (config.blockcypherName) {
          try {
            const response = await fetchWithTimeout(`${BLOCKCYPHER_API}/${config.blockcypherName}/addrs/${address}/balance`);
            if (response.ok) {
              const data = await response.json();
              return res.json({
                address: address,
                balance: `${(data.balance || 0) / 1e18}`,
                balanceUsd: null,
                transactionCount: data.n_tx || 0,
                firstSeen: null,
                lastSeen: null,
                received: `${(data.total_received || 0) / 1e18}`,
                sent: `${(data.total_sent || 0) / 1e18}`,
                tokens: [],
                nfts: [],
              });
            }
          } catch (e) {
            console.error("BlockCypher ETH wallet error:", e);
          }
        }
      }

      // BNB/BSC - Use JSON-RPC
      if (network === "bnb") {
        try {
          const balance = await jsonRpcCall(BSC_RPC_API, 'eth_getBalance', [address, 'latest']);
          const txCount = await jsonRpcCall(BSC_RPC_API, 'eth_getTransactionCount', [address, 'latest']);
          
          return res.json({
            address: address,
            balance: `${balance ? parseInt(balance, 16) / 1e18 : 0}`,
            balanceUsd: null,
            transactionCount: txCount ? parseInt(txCount, 16) : 0,
            firstSeen: null,
            lastSeen: null,
            received: "N/A",
            sent: "N/A",
            tokens: [],
            nfts: [],
          });
        } catch (e) {
          console.error("BSC wallet error:", e);
        }
      }

      // TRON - Use TronScan API
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/accountv2?address=${address}`);
          if (response.ok) {
            const account = await response.json();
            if (account.address) {
              return res.json({
                address: account.address,
                balance: `${(account.balance || 0) / 1e6}`,
                balanceUsd: null,
                transactionCount: account.transactions || 0,
                firstSeen: account.date_created ? new Date(account.date_created).toISOString() : null,
                lastSeen: account.latest_operation_time ? new Date(account.latest_operation_time).toISOString() : null,
                received: "N/A",
                sent: "N/A",
                tokens: (account.withPriceTokens || []).slice(0, 10).map((t: any) => ({
                  symbol: t.tokenAbbr || t.tokenName,
                  name: t.tokenName,
                  balance: t.balance ? (parseFloat(t.balance) / Math.pow(10, t.tokenDecimal || 6)).toFixed(4) : "0",
                })),
                nfts: [],
              });
            }
          }
        } catch (e) {
          console.error("TRON wallet error:", e);
        }
      }

      // TON - Use TonCenter
      if (network === "ton") {
        try {
          const response = await fetchWithTimeout(`${TONCENTER_API}/getAddressInformation?address=${address}`);
          if (response.ok) {
            const data = await response.json();
            if (data.ok && data.result) {
              return res.json({
                address: address,
                balance: `${(parseInt(data.result.balance) || 0) / 1e9}`,
                balanceUsd: null,
                transactionCount: 0,
                firstSeen: null,
                lastSeen: null,
                received: "N/A",
                sent: "N/A",
                tokens: [],
                nfts: [],
              });
            }
          }
        } catch (e) {
          console.error("TON wallet error:", e);
        }
      }

      // LTC - Use Litecoin Space API
      if (network === "ltc") {
        try {
          const response = await fetchWithTimeout(`${LITECOIN_SPACE_API}/address/${address}`);
          if (response.ok) {
            const data = await response.json();
            const chainStats = data.chain_stats || {};
            const mempoolStats = data.mempool_stats || {};
            const totalReceived = (chainStats.funded_txo_sum || 0) + (mempoolStats.funded_txo_sum || 0);
            const totalSent = (chainStats.spent_txo_sum || 0) + (mempoolStats.spent_txo_sum || 0);
            const balance = totalReceived - totalSent;
            const txCount = (chainStats.tx_count || 0) + (mempoolStats.tx_count || 0);
            return res.json({
              address: address,
              balance: `${balance / 1e8}`,
              balanceUsd: null,
              transactionCount: txCount,
              firstSeen: null,
              lastSeen: null,
              received: `${totalReceived / 1e8}`,
              sent: `${totalSent / 1e8}`,
              tokens: [],
              nfts: [],
            });
          }
        } catch (e) {
          console.error("Litecoin Space wallet error:", e);
        }
      }

      res.status(404).json({ error: "Address not found" });
    } catch (error) {
      console.error("Wallet error:", error);
      res.status(500).json({ error: "Failed to fetch wallet details" });
    }
  });

  // Wallet Transactions API
  app.get("/api/wallet/:network/:address/transactions", async (req, res) => {
    try {
      const { network, address } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Bitcoin - Use Mempool.space
      if (network === "btc") {
        try {
          const response = await fetchWithTimeout(`${MEMPOOL_API}/address/${address}/txs`);
          if (response.ok) {
            const txs = await response.json();
            const formattedTxs = txs.slice(0, 20).map((tx: any) => ({
              hash: tx.txid,
              blockHeight: tx.status?.block_height || 0,
              time: tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString() : new Date().toISOString(),
              from: tx.vin?.map((v: any) => v.prevout?.scriptpubkey_address).filter(Boolean) || [],
              to: tx.vout?.map((v: any) => v.scriptpubkey_address).filter(Boolean) || [],
              value: `${(tx.vout?.reduce((sum: number, v: any) => sum + (v.value || 0), 0) || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: tx.status?.confirmed ? 6 : 0,
              status: tx.status?.confirmed ? "confirmed" as const : "pending" as const,
            }));
            return res.json(formattedTxs);
          }
        } catch (e) {
          console.error("Mempool address txs error:", e);
        }
        
        // Fallback to blockchain.info
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIN_INFO_API}/rawaddr/${address}?limit=20`);
          if (response.ok) {
            const data = await response.json();
            const txs = (data.txs || []).map((tx: any) => ({
              hash: tx.hash,
              blockHeight: tx.block_height || 0,
              time: new Date(tx.time * 1000).toISOString(),
              from: tx.inputs?.map((i: any) => i.prev_out?.addr).filter(Boolean) || [],
              to: tx.out?.map((o: any) => o.addr).filter(Boolean) || [],
              value: `${(tx.out?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: tx.block_height ? 6 : 0,
              status: tx.block_height ? "confirmed" as const : "pending" as const,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("Blockchain.info wallet txs error:", e);
        }
        return res.status(503).json({ error: "Bitcoin API unavailable" });
      }

      // ETH - Use Blockchair
      if (network === "eth" && config.blockchairName) {
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIR_API}/${config.blockchairName}/dashboards/address/${address}?limit=20`);
          if (response.ok) {
            const data = await response.json();
            const transactions = data.data?.[address.toLowerCase()]?.transactions || [];
            
            // Fetch transaction details
            const txPromises = transactions.slice(0, 10).map((txHash: string) =>
              fetchWithTimeout(`${BLOCKCHAIR_API}/${config.blockchairName}/dashboards/transaction/${txHash}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
            );
            
            const txsData = await Promise.all(txPromises);
            const txs = txsData
              .filter(d => d?.data)
              .map(d => {
                const txHash = Object.keys(d.data)[0];
                const tx = d.data[txHash]?.transaction;
                return tx ? {
                  hash: tx.hash,
                  blockHeight: tx.block_id,
                  time: tx.time,
                  from: [tx.sender],
                  to: [tx.recipient],
                  value: `${(tx.value || 0) / 1e18}`,
                  fee: `${(tx.fee || 0) / 1e18}`,
                  confirmations: 6,
                  status: "confirmed" as const,
                } : null;
              })
              .filter(Boolean);
            
            return res.json(txs);
          }
        } catch (e) {
          console.error("Blockchair ETH wallet txs error:", e);
        }
        return res.status(503).json({ error: "Ethereum API unavailable" });
      }

      // BNB/BSC - Limited without indexer (no free transaction history API available)
      if (network === "bnb") {
        return res.json([]);
      }

      // TRON - Use TronScan API
      if (network === "trc20") {
        try {
          const response = await fetchWithTimeout(`${TRONSCAN_API}/transaction?address=${address}&limit=20&sort=-timestamp`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              const txs = data.data.map((tx: any) => ({
                hash: tx.hash,
                blockHeight: tx.block || 0,
                time: new Date(tx.timestamp).toISOString(),
                from: [tx.ownerAddress || "Unknown"],
                to: [tx.toAddress || tx.toAddressList?.[0] || "Unknown"],
                value: `${(tx.amount || tx.contractData?.amount || 0) / 1e6}`,
                fee: `${(tx.fee || 0) / 1e6}`,
                confirmations: tx.confirmed ? 6 : 0,
                status: tx.confirmed ? "confirmed" as const : "pending" as const,
              }));
              return res.json(txs);
            }
          }
          return res.status(503).json({ error: "TRON API unavailable" });
        } catch (e) {
          console.error("TRON wallet txs error:", e);
          return res.status(503).json({ error: "TRON API unavailable" });
        }
      }

      // TON - Use TonCenter
      if (network === "ton") {
        try {
          const response = await fetchWithTimeout(`${TONCENTER_API}/getTransactions?address=${address}&limit=20`);
          if (response.ok) {
            const data = await response.json();
            if (data.ok && data.result) {
              const txs = data.result.map((tx: any) => ({
                hash: tx.transaction_id?.hash || "",
                blockHeight: tx.transaction_id?.lt || 0,
                time: new Date(tx.utime * 1000).toISOString(),
                from: [tx.in_msg?.source || address],
                to: [tx.in_msg?.destination || address],
                value: `${(parseInt(tx.in_msg?.value) || 0) / 1e9}`,
                fee: `${(parseInt(tx.fee) || 0) / 1e9}`,
                confirmations: 6,
                status: "confirmed" as const,
              }));
              return res.json(txs);
            }
          }
          return res.status(503).json({ error: "TON API unavailable" });
        } catch (e) {
          console.error("TON wallet txs error:", e);
          return res.status(503).json({ error: "TON API unavailable" });
        }
      }

      // LTC - Use Litecoin Space API
      if (network === "ltc") {
        try {
          const response = await fetchWithTimeout(`${LITECOIN_SPACE_API}/address/${address}/txs`);
          if (response.ok) {
            const txsData = await response.json();
            const txs = txsData.slice(0, 20).map((tx: any) => ({
              hash: tx.txid,
              blockHeight: tx.status?.block_height || 0,
              time: tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString() : new Date().toISOString(),
              from: tx.vin?.map((v: any) => v.prevout?.scriptpubkey_address).filter(Boolean) || [],
              to: tx.vout?.map((v: any) => v.scriptpubkey_address).filter(Boolean) || [],
              value: `${(tx.vout?.reduce((sum: number, v: any) => sum + (v.value || 0), 0) || 0) / 1e8}`,
              fee: `${(tx.fee || 0) / 1e8}`,
              confirmations: tx.status?.confirmed ? 6 : 0,
              status: tx.status?.confirmed ? "confirmed" as const : "pending" as const,
            }));
            return res.json(txs);
          }
        } catch (e) {
          console.error("Litecoin Space wallet txs error:", e);
          return res.status(503).json({ error: "Litecoin API unavailable" });
        }
      }

      return res.status(503).json({ error: "Unable to fetch wallet transactions" });
    } catch (error) {
      console.error("Wallet transactions error:", error);
      return res.status(500).json({ error: "Failed to fetch wallet transactions" });
    }
  });

  // Top Wallets API - Use Blockchair for real data
  app.get("/api/top-wallets/:network", async (req, res) => {
    try {
      const { network } = req.params;
      const config = NETWORK_CONFIG[network];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid network" });
      }

      // Use Blockchair for top addresses (limited without API key)
      if (config.blockchairName && (network === "btc" || network === "eth" || network === "ltc")) {
        try {
          const response = await fetchWithTimeout(`${BLOCKCHAIR_API}/${config.blockchairName}/addresses?limit=10&s=balance(desc)`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              const divisor = network === "eth" ? 1e18 : 1e8;
              const wallets = data.data.map((addr: any, index: number) => ({
                rank: index + 1,
                address: addr.address,
                balance: (addr.balance / divisor).toLocaleString(),
                balanceUsd: addr.balance_usd ? `${(addr.balance_usd / 1e9).toFixed(1)}B` : "N/A",
                label: null,
                type: "unknown" as const,
              }));
              return res.json(wallets);
            }
          }
        } catch (e) {
          console.error("Blockchair top wallets error:", e);
        }
      }

      // For other networks, return empty as we don't have reliable free APIs
      res.json([]);
    } catch (error) {
      console.error("Top wallets error:", error);
      res.json([]);
    }
  });

  return httpServer;
}

function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e15) return `${(difficulty / 1e15).toFixed(2)}P`;
  if (difficulty >= 1e12) return `${(difficulty / 1e12).toFixed(2)}T`;
  if (difficulty >= 1e9) return `${(difficulty / 1e9).toFixed(2)}G`;
  if (difficulty >= 1e6) return `${(difficulty / 1e6).toFixed(2)}M`;
  return difficulty.toFixed(2);
}
