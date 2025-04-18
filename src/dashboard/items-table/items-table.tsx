import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Currency } from "@/models";
import { formatDistance } from "date-fns";
import React from "react";
import { PriceResponse } from "../dashboard";

type Props = {
  prices: PriceResponse;
};

export default function ItemsTable({ prices }: Props) {
  const [search, setSearch] = React.useState("");

  const result = prices.items.map((item) => ({
    id: item.id,
    item: item.name,
    from: item.aPrice,
    to: item.bPrice,
    difference: item.diffPrice,
    times: `x${Math.abs((item.diffPercentage / 100) * -1).toFixed(2)}`,
    percentage: `${Math.abs(item.diffPercentage * -1).toFixed(2)}%`,
  }));

  const filteredResult = React.useMemo(() => {
    if (!search) {
      return result;
    }

    return result.filter((item) => {
      const searchLower = search.toLowerCase();
      return item.item.toLowerCase().includes(searchLower);
    });
  }, [search, result]);

  return (
    <div className="py-10 font-medium">
      <div className="container max-w-screen-md mx-auto">
        <div className="flex items-end justify-between mb-2">
          <Input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="max-w-xs border-black"
          />
          <Badge variant="outline" className="border-black">
            Updated {formatDistance(new Date(), prices.lastUpdated)} ago
          </Badge>
        </div>

        <div className="border border-black rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-[125px] text-right">
                  Source Price
                </TableHead>
                <TableHead className="w-[125px] text-right">
                  Target Price
                </TableHead>
                <TableHead className="w-[125px] text-right">
                  Difference
                </TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResult.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <a
                      href={`https://www.wowhead.com/classic/item=${item.id}/`}
                      target="_blank"
                    >
                      {item.item}
                    </a>
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay price={item.from} />
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay price={item.to} />
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay price={item.difference} />
                  </TableCell>
                  <TableCell className="font-mono text-right">
                    {item.times}
                  </TableCell>
                  <TableCell className="font-mono text-right">
                    {item.percentage}
                  </TableCell>
                </TableRow>
              ))}
              {filteredResult.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function CurrencyDisplay({ price }: { price: Currency }) {
  return (
    <div className="grid grid-cols-3 font-mono">
      <div className="flex justify-end">
        {price.gold}
        <span className="mt-1 inline-block rounded-full w-2.5 h-2 -rotate-12 bg-amber-300 ml-0.5" />
      </div>
      <div className="flex justify-end">
        {price.silver}
        <span className="mt-1 inline-block rounded-full w-2.5 h-2 -rotate-12 bg-gray-400 ml-0.5" />
      </div>
      <div className="flex justify-end">
        {price.copper}
        <span className="mt-1 inline-block rounded-full w-2.5 h-2 -rotate-12 bg-amber-800 ml-0.5" />
      </div>
    </div>
  );
}
