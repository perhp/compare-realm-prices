import { serve } from "bun";
import index from "./index.html";
import { CompareItem } from "./models";
import { comparePrices } from "./pricings/compare";
import { getPrices } from "./pricings/get-prices";

export const FIFTEEN_MINTUES = 1000 * 60 * 15;

let lastUpdated = 0;
let itemsCache: CompareItem[] = [];

const server = serve({
  routes: {
    // Serve the index.html file for all routes
    "/*": index,

    // API endpoints
    "/api/compared-prices": {
      async GET(request: Request) {
        const params = new URL(request.url).searchParams;
        const auctionHouseAID = +(params.get("auctionHouseAID") || 564); // Soulseeker
        const auctionHouseBID = +(params.get("auctionHouseBID") || 560); // Thunderstrike

        const currentTime = Date.now();
        if (currentTime - lastUpdated < FIFTEEN_MINTUES && itemsCache.length) {
          return Response.json({ lastUpdated, items: itemsCache });
        }

        const [aItems, bItems] = await getPrices(
          auctionHouseAID,
          auctionHouseBID,
        );

        const compared = await comparePrices(aItems, bItems);
        itemsCache = compared;
        lastUpdated = currentTime;

        return Response.json({ lastUpdated, items: compared });
      },
    },
  },

  development: process.env.NODE_ENV !== "production",
  port: 3001,
});

console.log(`🚀 Server running at ${server.url}`);
