import { EmptyState } from "@/components/ui/States";

export function PlaceholderPage({ title, icon = "construction" }: { title: string; icon?: string }) {
  return (
    <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8">
      <EmptyState title={title} description="This screen is scaffolded and will be wired up in an upcoming build step." icon={icon} />
    </div>
  );
}
