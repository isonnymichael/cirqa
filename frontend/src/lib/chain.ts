import { defineChain } from "thirdweb/chains";

export const kiiTestnet = defineChain({
  id: 1336,
  name: "Kii Testnet Oro",
  nativeCurrency: {
    name: "Kii",
    symbol: "KII",
    decimals: 18,
  },
  rpc: "https://json-rpc.uno.sentry.testnet.v3.kiivalidator.com/",
  blockExplorers: [
    {
      name: "KiiChain Explorer",
      url: "https://explorer.kiichain.io",
    },
  ],
});