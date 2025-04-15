export interface Item {
  auctionHouseId: number;
  itemId: number;
  petSpeciesId: number;
  minBuyout: number;
  quantity: number;
  marketValue: number;
  historical: number;
  numAuctions: number;
}

export interface CompareItem {
  id: number;
  name: string;
  aPrice: Currency;
  bPrice: Currency;
  diff: number;
  diffPrice: Currency;
  diffPercentage: number;
}

export interface Currency {
  gold: number;
  silver: number;
  copper: number;
}

export type AllItemsDictionary = Record<
  string,
  {
    itemId: number;
    name: string;
    icon: string;
    class: string;
    subclass: string;
    sellPrice: number;
    quality: string;
    itemLevel: number;
    requiredLevel: number;
    slot: string;
    tooltip: {
      label: string;
      format?: string;
    }[];
    itemLink: string;
    contentPhase: number;
    uniqueName: string;
  }
>;
