import { Compass } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <Panel className="mx-auto max-w-md overflow-hidden p-8 text-center">
        <div className="icon-crystal mx-auto h-14 w-14">
          <Compass className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Off the map.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-6 text-[var(--muted-strong)]">
          We couldn&apos;t find that page. Head back to the home screen and pick a destination from there.
        </p>
        <Link
          className="premium-control mt-6 inline-flex h-10 items-center gap-2 rounded-[12px] border border-[var(--line-strong)] bg-white/[0.04] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/[0.07]"
          href="/"
        >
          Back to home
        </Link>
      </Panel>
    </main>
  );
}
