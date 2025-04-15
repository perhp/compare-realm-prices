import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompareItem } from "@/models";
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
      <div className="flex flex-col h-screen bg-slate-800">
        <div className="flex items-center h-10 px-8 text-sm font-medium text-gray-100 bg-slate-900 col-span-full" />
        <div className="grid items-center text-2xl font-bold text-gray-100 place-content-center grow">
          <LoaderPinwheel className="animate-spin size-14" />
        </div>
      </div>
    );
  }

  if (pricesIsError || !prices) {
    return <div>Error</div>;
  }

  const result = prices.map((item) => ({
    item: item.name,
    from: `${item.aPrice.gold}g ${item.aPrice.silver}s ${item.aPrice.copper}c`,
    to: `${item.bPrice.gold}g ${item.bPrice.silver}s ${item.bPrice.copper}c`,
    difference: `${Math.abs(item.diffPrice.gold)}g ${Math.abs(item.diffPrice.silver)}s ${Math.abs(item.diffPrice.copper)}c`,
    times: `x${Math.abs((item.diffPercentage / 100) * -1).toFixed(2)}`,
    percentage: `${Math.abs(item.diffPercentage * -1).toFixed(2)}%`,
  }));

  return (
    <div className="bg-black text-gray-100 py-10">
      <div className="container mx-auto max-w-screen-sm">
        <div className="border border-gray-300">
          <Table className="bg-gray-900">
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Source Price</TableHead>
                <TableHead>Target Price</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>x</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((item) => (
                <TableRow key={item.item}>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell>{item.from}</TableCell>
                  <TableCell>{item.to}</TableCell>
                  <TableCell>{item.difference}</TableCell>
                  <TableCell>{item.times}</TableCell>
                  <TableCell>{item.percentage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
