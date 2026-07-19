import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import { WalletConnectModal } from "@/features/wallet/WalletConnectModal";
import { useAutoSyncPayoutAddresses } from "@/lib/index/hooks";

export function AppShell() {
  useAutoSyncPayoutAddresses();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <TopNav />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <WalletConnectModal />
    </div>
  );
}
