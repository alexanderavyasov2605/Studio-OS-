"use client";
import { useState } from "react";
import type { CatalogImage as ImageData } from "@/lib/catalog";
export function CatalogImage({ image }: { image?: ImageData }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!image || failedUrl === image.url) return <div className="catalog-image catalog-image--empty" role="img" aria-label="Изображение недоступно">Изображение недоступно</div>;
  // Browser-only media request; no privileged image proxy or server fetch.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="catalog-image" src={image.url} alt={image.alt} width={720} height={540} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(image.url)} />;
}
