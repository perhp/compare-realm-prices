interface CompareItem {
  id: number;
  name: string;
  aPrice: { gold: number; silver: number; copper: number };
  bPrice: { gold: number; silver: number; copper: number };
  diff: number;
  diffPrice: { gold: number; silver: number; copper: number };
}

function convertCopperToGSC(totalCopper: number): { gold: number; silver: number; copper: number } {
  const gold = Math.floor(totalCopper / 10000);
  const remainderAfterGold = totalCopper % 10000;
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
  .filter((aItem: any) => bItemsDictionary[aItem.itemId] && aItem.numAuctions > 20 && bItemsDictionary[aItem.itemId].numAuctions > 20)
  .map((aItem: any) => {
    const bItem = bItemsDictionary[aItem.itemId];
    const diff = aItem.marketValue - (bItem?.marketValue || 0);

    return {
      id: aItem.itemId,
      name: allItemsDictionary[aItem.itemId]?.name ?? "Unknown",
      aPrice: convertCopperToGSC(aItem.marketValue),
      bPrice: convertCopperToGSC(bItem?.marketValue || 0),
      diff,
      diffPrice: convertCopperToGSC(diff),
    };
  })
  .sort((a: CompareItem, b: CompareItem) => b.diff - a.diff);

await Bun.write("./data/compared-items.json", JSON.stringify(compared, null, 2));
