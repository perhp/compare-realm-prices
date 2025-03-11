const buyLimitInGold = 40;

interface CompareItem {
  id: number;
  name: string;
  aPrice: { gold: number; silver: number; copper: number };
  bPrice: { gold: number; silver: number; copper: number };
  diff: number;
  diffPrice: { gold: number; silver: number; copper: number };
}

const comparedItems: CompareItem[] = await Bun.file("./data/compared-items.json").json();
const buyables = comparedItems.filter((item) => item.aPrice.gold <= buyLimitInGold);

await Bun.write("./data/buyables.json", JSON.stringify(buyables, null, 2));
