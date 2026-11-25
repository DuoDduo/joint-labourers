// Used only by the static preview build: no image optimiser on GitHub Pages, so serve the
// original file from under the base path.
export default function staticLoader({ src, width }: { src: string; width: number }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const url = src.startsWith("/") ? `${base}${src}` : src;
  return `${url}?w=${width}`;
}
