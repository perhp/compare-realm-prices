import type {
  AllItemsDictionary,
  CompareItem,
  Currency,
  Item,
} from "../models";

function convertCopperToGSC(totalCopper: number): Currency {
  const gold = Math.floor(totalCopper / 10_000);
  const remainderAfterGold = totalCopper % 10_000;
  const silver = Math.floor(remainderAfterGold / 100);
  const copper = remainderAfterGold % 100;
  return { gold, silver, copper, total: totalCopper };
}

function buildItemDictionary(items: Item[]): Record<number, Item> {
  return items.reduce(
    (dict, item) => {
      dict[item.itemId] = item;
      return dict;
    },
    {} as Record<number, Item>,
  );
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

function withinPercent(
  minBuyout: number,
  marketValue: number,
  threshold = 0.25,
): boolean {
  if (marketValue <= 0) {
    return false;
  }

  return Math.abs(minBuyout - marketValue) / marketValue <= threshold;
}

function canCompare(
  aItem: Item,
  bItem: Item,
  gameItem: AllItemsDictionary[string],
): boolean {
  if (!isValidGameItem(gameItem)) {
    return false;
  }

  if (!bItem || bItem.marketValue <= 1000) {
    return false;
  }

  if (
    !withinPercent(aItem.minBuyout, aItem.marketValue) ||
    !withinPercent(bItem.minBuyout, bItem.marketValue)
  ) {
    return false;
  }

  return true;
}

function getStackSize({ tooltip }: AllItemsDictionary[string]): number {
  return (
    Number(
      tooltip
        .find(({ label }) => label.toLowerCase().startsWith("max stack"))
        ?.label.match(/\d+/)?.[0],
    ) || 1
  );
}

export async function comparePrices(aItems: Item[], bItems: Item[]) {
  const allItemsDictionary = (await Bun.file(
    "./data/all-items-dictionary.json",
  ).json()) as AllItemsDictionary;

  const bItemsDictionary = buildItemDictionary(bItems);

  const compared: CompareItem[] = aItems
    .filter((aItem) => {
      const gameItem = allItemsDictionary[aItem.itemId];
      const bItem = bItemsDictionary[aItem.itemId];
      return canCompare(aItem, bItem, gameItem);
    })
    .map((aItem) => {
      const gameItem = allItemsDictionary[aItem.itemId];
      const bItem = bItemsDictionary[aItem.itemId];
      const diff = aItem.marketValue - (bItem?.marketValue || 0);
      const stackSize = getStackSize(gameItem);

      return {
        id: aItem.itemId,
        name: allItemsDictionary[aItem.itemId].name,
        stackSize: stackSize,
        aPrice: convertCopperToGSC(aItem.marketValue),
        aStackPrice: convertCopperToGSC(aItem.marketValue * stackSize),
        bPrice: convertCopperToGSC(bItem?.marketValue || 0),
        bStackPrice: convertCopperToGSC((bItem?.marketValue || 0) * stackSize),
        diffStackPrice: convertCopperToGSC(Math.abs(diff || 0) * stackSize),
        diffPrice: convertCopperToGSC(Math.abs(diff)),
        diffPercentage:
          aItem.marketValue > 0
            ? ((bItem?.marketValue || 1) / aItem.marketValue) * 100
            : 0,
      } satisfies CompareItem;
    })
    .filter((item) => !isNaN(item.diffPercentage) && item.diffPercentage > 0)
    .sort((a, b) => b.diffPercentage - a.diffPercentage);

  return compared;
}
