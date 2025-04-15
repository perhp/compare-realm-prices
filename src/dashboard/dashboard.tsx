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
import { LoaderPinwheel } from "lucide-react";

function useComparedPrices() {
  return useQuery({
    queryKey: ["compared-prices"],
    queryFn: async (): Promise<Array<CompareItem>> => {
      const response = await fetch("/api/compared-prices");
      return await response.json();
    },
    refetchInterval: 1000 * 60 * 60, // 1 hour
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

  if (pricesIsError || !prices) {
    return <div>Error</div>;
  }

  const result = prices.map((item) => ({
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
