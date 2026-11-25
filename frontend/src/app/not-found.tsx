import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <Image src="/images/illustrations/ezekiel-22-30.jpg" alt="" width={1080} height={1080} className="h-auto w-56 rounded-2xl" />
      <h1 className="text-4xl font-semibold">We couldn't find that page</h1>
      <p>It may have moved, or the need may no longer be listed.</p>
      <ButtonLink href="/">Back to home</ButtonLink>
    </main>
  );
}
