import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompareItem, Currency } from "@/models";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { LoaderPinwheel } from "lucide-react";

function useComparedPrices() {
  return useQuery({
    queryKey: ["compared-prices"],
    queryFn: async (): Promise<{
      lastUpdated: number;
      items: Array<CompareItem>;
    }> => {
      const response = await fetch("/api/compared-prices");
      return await response.json();
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
}

export default function Dashboard() {
  const {
    data: prices,
    isLoading: pricesIsLoading,
    isError: pricesIsError,
  } = useComparedPrices();

  if (pricesIsLoading) {
    return (
      <div className="grid h-screen place-content-center">
        <LoaderPinwheel className="animate-spin size-14" />
      </div>
    );
  }

  if (pricesIsError || !prices?.items) {
    return <div>Error</div>;
  }

  const result = prices.items.map((item) => ({
    id: item.id,
    item: item.name,
    from: item.aPrice,
    to: item.bPrice,
    difference: item.diffPrice,
    times: `x${Math.abs((item.diffPercentage / 100) * -1).toFixed(2)}`,
    percentage: `${Math.abs(item.diffPercentage * -1).toFixed(2)}%`,
  }));

  return (
    <div className="py-10 font-medium">
      <div className="container max-w-screen-md mx-auto">
        <Badge variant="outline" className="border-black">
          Last updated: {format(prices.lastUpdated, "dd/MM/yyyy")}
        </Badge>
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
              {result.map((item) => (
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
