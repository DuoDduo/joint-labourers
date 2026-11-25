import { Footer } from "@/components/layout/Footer";

// Each page renders its own <TopPanel> (navigation + hero) so the hero can live inside the panel.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-aqua px-4 py-2 font-semibold text-night focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div id="main">{children}</div>
      <Footer />
    </>
  );
}
