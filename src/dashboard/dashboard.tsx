import { CompareItem } from "@/models";
import { useQuery } from "@tanstack/react-query";
import { LoaderPinwheel } from "lucide-react";
import ItemsTable from "./items-table/items-table";

export interface PriceResponse {
  lastUpdated: number;
  items: CompareItem[];
}

function useComparedPrices() {
  return useQuery({
    queryKey: ["compared-prices"],
    queryFn: async (): Promise<PriceResponse> => {
      const response = await fetch("/api/compared-prices");
      return await response.json();
    },
    refetchInterval: 1000 * 60 * 15, // 15 minutes
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

  return <ItemsTable prices={prices} />;
}
