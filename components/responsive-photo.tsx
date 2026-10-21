type Source = { src: string; width: number; height: number };

/* Serves the purpose-made crop for each layout: phones (≤480px), tablets (≤1024px), desktop.
   Files are pre-optimised WebP shown at or below their native size, so they bypass the image optimiser. */
export default function ResponsivePhoto({ desktop, tablet, mobile, alt, className }: { desktop: Source; tablet: Source; mobile: Source; alt: string; className?: string }) {
  return (
    <picture className={className}>
      <source media="(max-width: 480px)" srcSet={mobile.src} width={mobile.width} height={mobile.height} />
      <source media="(max-width: 1024px)" srcSet={tablet.src} width={tablet.width} height={tablet.height} />
      <img src={desktop.src} width={desktop.width} height={desktop.height} alt={alt} loading="lazy" decoding="async" />
    </picture>
  );
}
