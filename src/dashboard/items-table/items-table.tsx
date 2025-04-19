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
import React, { useCallback, useMemo, useState } from "react";
import { PriceResponse } from "../dashboard";

type StackSize = number | "None";

type ResultRow = {
  id: number;
  item: string;
  stackSize: number;
  from: Currency;
  fromStack: Currency;
  to: Currency;
  toStack: Currency;
  difference: Currency;
  differenceStack: Currency;
  times: string;
  percentage: string;
};

interface Props {
  prices: PriceResponse;
}

export default function ItemsTable({ prices }: Props) {
  const [search, setSearch] = useState("");
  const [stackSize, setStackSize] = useState<StackSize>("None");
  const [price, setPrice] = useState<Currency>({
    copper: 0,
    silver: 0,
    gold: 0,
    total: 0,
  });

  const itemsData = useMemo<ResultRow[]>(() => {
    return prices.items.map((item) => ({
      id: item.id,
      item: item.name,
      stackSize: item.stackSize,
      from: item.aPrice,
      fromStack: item.aStackPrice,
      to: item.bPrice,
      toStack: item.bStackPrice,
      difference: item.diffPrice,
      differenceStack: item.diffStackPrice,
      times: `x${Math.abs(item.diffPercentage / -100).toFixed(2)}`,
      percentage: `${Math.abs(item.diffPercentage * -1).toFixed(2)}%`,
    }));
  }, [prices.items]);

  const totalFilterValue =
    price.gold * 10000 + price.silver * 100 + price.copper;

  const filteredData = useMemo(() => {
    return itemsData.filter((row) => {
      if (stackSize !== "None" && row.stackSize !== stackSize) {
        return false;
      }

      if (totalFilterValue > row.from.total) {
        return false;
      }

      if (search && !row.item.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [itemsData, search, stackSize, totalFilterValue]);

  const stackSizes = useMemo(() => {
    return [...new Set(itemsData.map((r) => r.stackSize))].sort(
      (a, b) => b - a,
    );
  }, [itemsData]);

  const handlePriceChange = useCallback(
    (field: keyof Currency) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPrice((prev) => ({ ...prev, [field]: +e.target.value })),
    [],
  );

  return (
    <div className="py-10 font-medium">
      <div className="container max-w-screen-lg mx-auto">
        <div className="flex items-end mb-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={stackSize.toString()}
            onValueChange={(value) =>
              setStackSize(value === "None" ? "None" : +value)
            }
          >
            <SelectTrigger className="ml-2">
              {stackSize !== "None" ? stackSize : "Stack Size"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              {stackSizes.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex ml-2">
            <PriceInput
              value={price.gold}
              onChange={handlePriceChange("gold")}
              color="bg-amber-300"
            />
            <PriceInput
              value={price.silver}
              onChange={handlePriceChange("silver")}
              color="bg-gray-400"
            />
            <PriceInput
              value={price.copper}
              onChange={handlePriceChange("copper")}
              color="bg-amber-800"
            />
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
                <TableHead className="w-[100px] text-right">Times</TableHead>
                <TableHead className="w-[100px] text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow key={row.id} className="odd:bg-gray-50">
                    <TableCell>
                      <a
                        href={`https://www.wowhead.com/classic/item=${row.id}/`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.item}
                      </a>
                    </TableCell>
                    <TableCell className="font-mono">{row.stackSize}</TableCell>
                    <PriceCell base={row.from} stack={row.fromStack} />
                    <PriceCell base={row.to} stack={row.toStack} />
                    <PriceCell
                      base={row.difference}
                      stack={row.differenceStack}
                    />
                    <TableCell className="font-mono text-right">
                      {row.times}
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      {row.percentage}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
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

function PriceInput({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  color: string;
}) {
  return (
    <div className="relative first:[&>input]:rounded-l last:[&>input]:rounded-r nth-[2]:-mx-px">
      <Input
        type="number"
        min={0}
        value={value || ""}
        onChange={onChange}
        className="w-16 shrink-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none rounded-none"
      />
      <span
        className={`absolute right-2 top-1/2 h-2 w-2.5 -translate-y-1/2 -rotate-12 rounded-full ${color}`}
      />
    </div>
  );
}

function PriceCell({ base, stack }: { base: Currency; stack: Currency }) {
  return (
    <TableCell>
      <Tooltip>
        <TooltipTrigger className="w-full">
          <CurrencyDisplay price={base} />
        </TooltipTrigger>
        <TooltipContent>
          <CurrencyDisplay price={stack} />
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

const CurrencyDisplay = React.memo(function CurrencyDisplay({
  price,
}: {
  price: Currency;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 font-mono shrink-0">
      <PriceUnit value={price.gold} dotColor="bg-amber-300" />
      <PriceUnit value={price.silver} dotColor="bg-gray-400" />
      <PriceUnit value={price.copper} dotColor="bg-amber-800" />
    </div>
  );
});

function PriceUnit({ value, dotColor }: { value: number; dotColor: string }) {
  return (
    <div className="flex justify-end">
      {value}
      <span
        className={`ml-0.5 mt-1 inline-block h-2 w-2.5 -rotate-12 rounded-full ${dotColor}`}
      />
    </div>
  );
}
