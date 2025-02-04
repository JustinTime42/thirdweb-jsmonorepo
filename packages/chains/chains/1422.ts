export default {
  "name": "Polygon zkEVM Testnet",
  "title": "Polygon zkEVM Testnet",
  "chain": "Polygon",
  "rpc": [
    "https://polygon-zkevm-testnet.rpc.thirdweb.com/${THIRDWEB_API_KEY}",
    "https://rpc.public.zkevm-test.net"
  ],
  "faucets": [],
  "nativeCurrency": {
    "name": "Ether",
    "symbol": "ETH",
    "decimals": 18
  },
  "infoURL": "https://polygon.technology/solutions/polygon-zkevm/",
  "shortName": "testnet-zkEVM-mango",
  "chainId": 1422,
  "networkId": 1422,
  "explorers": [
    {
      "name": "Polygon zkEVM explorer",
      "url": "https://explorer.public.zkevm-test.net",
      "standard": "EIP3091"
    }
  ],
  "testnet": true,
  "slug": "polygon-zkevm-testnet"
} as const;