import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Currency } from "@/models";
import { formatDistance } from "date-fns";
import React from "react";
import { PriceResponse } from "../dashboard";

type StackSizeNone = "None";

type Props = {
  prices: PriceResponse;
};

export default function ItemsTable({ prices }: Props) {
  const [search, setSearch] = React.useState("");
  const [stackSize, setStackSize] = React.useState<number | StackSizeNone>(
    "None",
  );
  const [price, setPrice] = React.useState<Currency>({
    copper: 0,
    gold: 0,
    silver: 0,
    total: 0,
  });

  const result = prices.items.map((item) => ({
    id: item.id,
    item: item.name,
    stackSize: item.stackSize,
    from: item.aPrice,
    fromStack: item.aStackPrice,
    to: item.bPrice,
    toStack: item.bStackPrice,
    difference: item.diffPrice,
    differenceStack: item.diffStackPrice,
    times: `x${Math.abs((item.diffPercentage / 100) * -1).toFixed(2)}`,
    percentage: `${Math.abs(item.diffPercentage * -1).toFixed(2)}%`,
  }));

  const filteredResult = React.useMemo(() => {
    if (
      !search &&
      stackSize === "None" &&
      price.gold === 0 &&
      price.silver === 0 &&
      price.copper === 0
    ) {
      return result;
    }

    return result.filter((item) => {
      if (stackSize !== "None" && item.stackSize !== stackSize) {
        return false;
      }

      const total = price.gold * 10000 + price.silver * 100 + price.copper;
      if (total > item.from.total) {
        return false;
      }

      const searchLower = search.toLowerCase();
      return item.item.toLowerCase().includes(searchLower);
    });
  }, [search, result]);

  const stackSizes = React.useMemo(() => {
    const sizes = new Set<number>();
    result.forEach((item) => {
      sizes.add(item.stackSize);
    });
    return Array.from(sizes).sort((a, b) => b - a);
  }, [result]);

  return (
    <div className="py-10 font-medium">
      <div className="container max-w-screen-lg mx-auto">
        <div className="flex items-end mb-2">
          <Input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="max-w-xs"
          />
          <Select
            value={stackSize?.toString()}
            onValueChange={(newStackSize) => {
              if (newStackSize === "None") {
                setStackSize("None");
                return;
              }

              setStackSize(+newStackSize);
            }}
          >
            <SelectTrigger className="ml-2">
              {stackSize !== "None" ? stackSize : "Stack Size"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"None"}>None</SelectItem>
              {stackSizes.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 ml-2">
            <div className="relative">
              <Input
                onChange={(e) => setPrice({ ...price, gold: +e.target.value })}
                className="w-16 pr-5"
              />
              <span className="rounded-full w-2.5 h-2 -rotate-12 bg-amber-300 absolute right-2 top-2/5" />
            </div>
            <div className="relative">
              <Input
                onChange={(e) =>
                  setPrice({ ...price, silver: +e.target.value })
                }
                className="w-16"
              />
              <span className="rounded-full w-2.5 h-2 -rotate-12 bg-gray-400 absolute right-2 top-2/5" />
            </div>
            <div className="relative">
              <Input
                onChange={(e) =>
                  setPrice({ ...price, copper: +e.target.value })
                }
                className="w-16"
              />
              <span className="rounded-full w-2.5 h-2 -rotate-12 bg-amber-800 absolute right-2 top-2/5" />
            </div>
          </div>

          <Badge variant="outline" className="ml-auto">
            Updated {formatDistance(new Date(), prices.lastUpdated)} ago
          </Badge>
        </div>

        <div className="border border-black rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-[55px]">Stack</TableHead>
                <TableHead className="w-[150px] text-right">Source</TableHead>
                <TableHead className="w-[150px] text-right">Target</TableHead>
                <TableHead className="w-[150px] text-right">
                  Difference
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResult.map((item) => (
                <TableRow key={item.id} className="odd:bg-gray-50">
                  <TableCell>
                    <a
                      href={`https://www.wowhead.com/classic/item=${item.id}/`}
                      target="_blank"
                    >
                      {item.item}
                    </a>
                  </TableCell>
                  <TableCell className="font-mono">{item.stackSize}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger className="w-full">
                        <CurrencyDisplay price={item.from} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <CurrencyDisplay price={item.fromStack} />
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger className="w-full">
                        <CurrencyDisplay price={item.to} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <CurrencyDisplay price={item.toStack} />
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger className="w-full">
                        <CurrencyDisplay price={item.difference} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <CurrencyDisplay price={item.differenceStack} />
                      </TooltipContent>
                    </Tooltip>
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
    <div className="grid grid-cols-3 gap-2 font-mono shrink-0">
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
