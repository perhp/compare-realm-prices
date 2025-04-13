import type { AllItemsDictionary, CompareItem, Item } from "./models";

function convertCopperToGSC(totalCopper: number): { gold: number; silver: number; copper: number } {
  const gold = Math.floor(totalCopper / 10_000);
  const remainderAfterGold = totalCopper % 10_000;
  const silver = Math.floor(remainderAfterGold / 100);
  const copper = remainderAfterGold % 100;
  return { gold, silver, copper };
}

function buildItemDictionary(items: Item[]): Record<number, Item> {
  return items.reduce((dict, item) => {
    dict[item.itemId] = item;
    return dict;
  }, {} as Record<number, Item>);
}

function isValidGameItem(item: AllItemsDictionary[string]): boolean {
  if (!item) {
    return false;
  }

  if (item.quality.toLowerCase() === "poor") {
    return false;
  }

  const itemClass = item.class.toLowerCase();
  if (itemClass !== "trade goods" && itemClass !== "consumable") {
    return false;
  }

  return true;
}

function withinThreshold(value: number, threshold = 0.5): boolean {
  return value >= 1 - threshold && value <= 1 + threshold;
}

function canCompare(aItem: Item, bItem: Item, gameItem: AllItemsDictionary[string]): boolean {
  if (!isValidGameItem(gameItem)) {
    return false;
  }

  if (!bItem || bItem.marketValue <= 1000) {
    return false;
  }

  const aItemDiff = aItem.marketValue / aItem.minBuyout;
  const bItemDiff = bItem.marketValue / bItem.minBuyout;
  if (!withinThreshold(aItemDiff) || !withinThreshold(bItemDiff)) {
    return false;
  }

  return true;
}

async function main() {
  const [allItemsDictionary, aItems, bItems] = await Promise.all([
    Bun.file("./data/all-items-dictionary.json").json() as Promise<AllItemsDictionary>,
    Bun.file("./data/a-items.json").json() as Promise<Item[]>,
    Bun.file("./data/b-items.json").json() as Promise<Item[]>,
  ]);

  const bItemsDictionary = buildItemDictionary(bItems);

  const compared: CompareItem[] = aItems
    .filter((aItem) => {
      const gameItem = allItemsDictionary[aItem.itemId];
      const bItem = bItemsDictionary[aItem.itemId];
      return canCompare(aItem, bItem, gameItem);
    })
    .map((aItem) => {
      const bItem = bItemsDictionary[aItem.itemId];
      const diff = aItem.marketValue - (bItem?.marketValue || 0);

      return {
        id: aItem.itemId,
        name: allItemsDictionary[aItem.itemId].name,
        aPrice: convertCopperToGSC(aItem.marketValue),
        bPrice: convertCopperToGSC(bItem?.marketValue || 0),
        diff,
        diffPrice: convertCopperToGSC(Math.abs(diff)),
        diffPercentage: aItem.marketValue > 0 ? ((bItem?.marketValue || 1) / aItem.marketValue) * 100 : 0,
      } satisfies CompareItem;
    })
    .filter((item) => !isNaN(item.diffPercentage) && item.diffPercentage > 0)
    .sort((a, b) => b.diffPercentage - a.diffPercentage);

  const result = compared.map((item) => ({
    Item: item.name,
    From: `${item.aPrice.gold}g ${item.aPrice.silver}s ${item.aPrice.copper}c`,
    To: `${item.bPrice.gold}g ${item.bPrice.silver}s ${item.bPrice.copper}c`,
    Difference: `${Math.abs(item.diffPrice.gold)}g ${Math.abs(item.diffPrice.silver)}s ${Math.abs(item.diffPrice.copper)}c`,
    x: `x${Math.abs((item.diffPercentage / 100) * -1).toFixed(2)}`,
    "%": `${Math.abs(item.diffPercentage * -1).toFixed(2)}%`,
  }));

  Bun.file("./data/compared-items.json").write(JSON.stringify(result, null, 2));
  console.table(result, ["Item", "From", "To", "Difference", "x", "%"]);
}

await main();
