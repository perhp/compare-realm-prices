interface CompareItem {
  id: number;
  name: string;
  aPrice: { gold: number; silver: number; copper: number };
  bPrice: { gold: number; silver: number; copper: number };
  diff: number;
  diffPrice: { gold: number; silver: number; copper: number };
  diffPercentage: number;
}

function convertCopperToGSC(totalCopper: number): { gold: number; silver: number; copper: number } {
  const gold = Math.floor(totalCopper / 10_000);
  const remainderAfterGold = totalCopper % 10_000;
  const silver = Math.floor(remainderAfterGold / 100);
  const copper = remainderAfterGold % 100;

  return { gold, silver, copper };
}

function buildItemDictionary(items: any[]): Record<number, any> {
  return items.reduce<Record<number, any>>((dict, item) => {
    dict[item.itemId] = item;
    return dict;
  }, {});
}

const [allItemsDictionary, aItems, bItems] = await Promise.all([
  Bun.file("./data/all-items-dictionary.json").json(),
  Bun.file("./data/a-items.json").json(),
  Bun.file("./data/b-items.json").json(),
]);

const bItemsDictionary = buildItemDictionary(bItems);

const compared: CompareItem[] = aItems
  .filter((aItem: any) => {
    const gameItem = allItemsDictionary[aItem.itemId];
    if (
      !gameItem ||
      gameItem.quality.toLowerCase() === "poor" ||
      (gameItem.class.toLowerCase() !== "consumable" && gameItem.class.toLowerCase() !== "trade goods")
    ) {
      return false;
    }

    const bItem = bItemsDictionary[aItem.itemId];
    if (!bItem) {
      return false;
    }

    if (aItem.numAuctions < 20 || bItemsDictionary[aItem.itemId].numAuctions < 20) {
      return false;
    }

    const aItemDiffToPercentage = aItem.marketValue / aItem.minBuyout;
    const bItemDiffToPercentage = bItem.marketValue / bItem.minBuyout;

    if (aItemDiffToPercentage < 0.5 || aItemDiffToPercentage > 1.5) {
      return false;
    }

    if (bItemDiffToPercentage < 0.5 || bItemDiffToPercentage > 1.5) {
      return false;
    }

    return true;
  })
  .map((aItem: any) => {
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
  .filter((item: CompareItem) => !isNaN(item.diffPercentage))
  .sort((a: CompareItem, b: CompareItem) => b.diffPercentage - a.diffPercentage);

await Bun.write("./data/compared-items.json", JSON.stringify(compared, null, 2));

console.table(
  compared
    .slice(compared.length - 25, compared.length)
    .reverse()
    .map((item) => ({
      Item: item.name,
      From: `${item.aPrice.gold}g ${item.aPrice.silver}s ${item.aPrice.copper}c`,
      To: `${item.bPrice.gold}g ${item.bPrice.silver}s ${item.bPrice.copper}c`,
      Difference: `${Math.abs(item.diffPrice.gold)}g ${Math.abs(item.diffPrice.silver)}s ${Math.abs(item.diffPrice.copper)}c`,
      "%": `${Math.abs(item.diffPercentage).toFixed(2)}%`,
    })),
  ["Item", "From", "To", "Difference", "%"]
);
