"use client";

import { Button } from "@/components/ui/Button";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-semibold">Something went wrong</h1>
      <p>We couldn't load this page. If you were giving, nothing was charged.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
