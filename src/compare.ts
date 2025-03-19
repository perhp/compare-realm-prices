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

const [allItemsDictionary, aItems, bItems] = await Promise.all([
  Bun.file("./data/all-items-dictionary.json").json() as Promise<AllItemsDictionary>,
  Bun.file("./data/a-items.json").json() as Promise<Item[]>,
  Bun.file("./data/b-items.json").json() as Promise<Item[]>,
]);

const bItemsDictionary = buildItemDictionary(bItems);

const compared: CompareItem[] = aItems
  .filter((aItem) => {
    const gameItem = allItemsDictionary[aItem.itemId];

    if (
      !gameItem ||
      gameItem.quality.toLowerCase() === "poor" ||
      (gameItem.class.toLowerCase() !== "trade goods" && gameItem.class.toLowerCase() !== "consumables")
    ) {
      return false;
    }

    const bItem = bItemsDictionary[aItem.itemId];
    if (!bItem) {
      return false;
    }

    if (bItem.marketValue <= 1000) {
      return false;
    }

    const threshold = 0.5;
    const aItemDiffToPercentage = aItem.marketValue / aItem.minBuyout;
    const bItemDiffToPercentage = bItem.marketValue / bItem.minBuyout;

    if (aItemDiffToPercentage < 1 - threshold || aItemDiffToPercentage > 1 + threshold) {
      return false;
    }

    if (bItemDiffToPercentage < 1 - threshold || bItemDiffToPercentage > 1 + threshold) {
      return false;
    }

    return true;
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
      diffPercentage: aItem.marketValue > 0 ? (diff / aItem.marketValue) * 100 : 0,
    } satisfies CompareItem;
  })
  .filter((item: CompareItem) => !isNaN(item.diffPercentage) && item.diffPercentage < 0)
  .sort((a: CompareItem, b: CompareItem) => b.diffPercentage - a.diffPercentage);

await Bun.write("./data/compared-items.json", JSON.stringify(compared, null, 2));

console.table(
  compared
    .slice(compared.length - 30, compared.length)
    .reverse()
    .map((item) => ({
      Item: item.name,
      From: `${item.aPrice.gold}g ${item.aPrice.silver}s ${item.aPrice.copper}c`,
      To: `${item.bPrice.gold}g ${item.bPrice.silver}s ${item.bPrice.copper}c`,
      Difference: `${Math.abs(item.diffPrice.gold)}g ${Math.abs(item.diffPrice.silver)}s ${Math.abs(item.diffPrice.copper)}c`,
      "%": `${(item.diffPercentage * -1).toFixed(2)}%`,
    })),
  ["Item", "From", "To", "Difference", "%"]
);
