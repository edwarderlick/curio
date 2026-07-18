import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useIsAnyWalletConnected, useWalletStore } from "@/features/wallet/store";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-body-md text-body-md pb-1 border-b-2 transition-colors ${
    isActive ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:text-on-surface"
  }`;

export function TopNav() {
  const connected = useIsAnyWalletConnected();
  const openConnectModal = useWalletStore((s) => s.openConnectModal);

  return (
    <header className="bg-surface/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/10 shadow-xl">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max-width mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary-container">
            Curio
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/explore" className={navLinkClass}>
              Explore
            </NavLink>
            <NavLink to="/explore" className={navLinkClass}>
              Creators
            </NavLink>
            <NavLink to="/notifications" className={navLinkClass}>
              Notifications
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            to="/studio"
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-white/5 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-xl">nest_audio</span>
            <span className="font-body-md">Creator Studio</span>
          </Link>
          <Link
            to="/notifications"
            className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-white/5 rounded-full transition-all"
            aria-label="Notifications"
          >
            notifications
          </Link>
          <Link
            to="/account"
            className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-white/5 rounded-full transition-all"
            aria-label="Account settings"
          >
            account_balance_wallet
          </Link>
          <Button size="md" onClick={openConnectModal}>
            {connected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </header>
  );
}
