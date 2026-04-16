import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: () => (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Please use the main sign-in screen.</p>
        <Link to="/" className="text-primary font-medium hover:underline">Go to sign in</Link>
      </div>
    </div>
  ),
});
