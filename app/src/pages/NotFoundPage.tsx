import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <EmptyState
        icon="explore_off"
        title="Page not found"
        description="This page doesn't exist or may have moved."
        action={
          <Link to="/">
            <Button size="sm">Back to home</Button>
          </Link>
        }
      />
    </div>
  );
}
