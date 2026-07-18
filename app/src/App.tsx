import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useLivePrices } from "@/lib/chains/useLivePrices";
import { AppProviders } from "@/app/Providers";
import { WalletSync } from "@/features/wallet/WalletSync";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function LivePricesMount() {
  useLivePrices();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <LivePricesMount />
        <WalletSync />
        <RouterProvider router={router} />
      </AppProviders>
    </QueryClientProvider>
  );
}
