export function Footer() {
  return (
    <footer className="bg-surface-container-lowest py-12 mt-20 border-t border-outline-variant/20">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tighter">Curio</span>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs text-center md:text-left">
            © 2026 Curio. Built on decentralized infrastructure.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors hover:underline" href="#">
            Documentation
          </a>
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors hover:underline" href="#">
            Privacy Policy
          </a>
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors hover:underline" href="#">
            Security
          </a>
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors hover:underline" href="#">
            Infrastructure Status
          </a>
        </div>
      </div>
    </footer>
  );
}
