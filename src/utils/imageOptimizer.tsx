import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

/**
 * Generates responsive AVIF / WebP / JPEG image URLs for Unsplash CDN URLs.
 * Passes through local/data/non-Unsplash URLs untouched.
 */
export function buildOptimizedImageUrl(
  url: string,
  width: number,
  format: 'avif' | 'webp' | 'auto' = 'auto',
  quality = 75
): string {
  if (!url) return '';
  if (!url.includes('images.unsplash.com')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('q', String(quality));
    parsed.searchParams.set('fit', parsed.searchParams.get('fit') || 'crop');
    if (format === 'avif') {
      parsed.searchParams.set('fm', 'avif');
      parsed.searchParams.delete('auto');
    } else if (format === 'webp') {
      parsed.searchParams.set('fm', 'webp');
      parsed.searchParams.delete('auto');
    } else {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.delete('fm');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildResponsiveSrcSet(
  url: string,
  widths: number[],
  format: 'avif' | 'webp' | 'auto',
  quality = 75
): string | undefined {
  if (!url || !url.includes('images.unsplash.com')) return undefined;
  return widths
    .map((w) => `${buildOptimizedImageUrl(url, w, format, quality)} ${w}w`)
    .join(', ');
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  width?: number;
  height?: number;
  className?: string;
  pictureClassName?: string;
  priority?: boolean;
  fallbackSrc?: string;
  fallbackLabel?: string;
  onClick?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  widths = [240, 400, 640],
  sizes = '(max-width: 640px) 44vw, 240px',
  width,
  height,
  className = '',
  pictureClassName = 'contents',
  priority = false,
  fallbackSrc,
  fallbackLabel,
  onClick,
}) => {
  const [activeSrc, setActiveSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setActiveSrc(src);
    setHasError(false);
  }, [src]);

  if (hasError || !activeSrc) {
    return (
      <div
        onClick={onClick}
        className="w-full h-full rounded bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-1"
      >
        <Package className="w-6 h-6" aria-hidden="true" />
        {fallbackLabel && (
          <span className="text-[10px] text-slate-600 font-medium px-2 truncate max-w-full">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  const isUnsplash = activeSrc.includes('images.unsplash.com');
  const avifSrcSet = isUnsplash ? buildResponsiveSrcSet(activeSrc, widths, 'avif', 65) : undefined;
  const webpSrcSet = isUnsplash ? buildResponsiveSrcSet(activeSrc, widths, 'webp', 75) : undefined;
  const fallbackImgSrc = isUnsplash
    ? buildOptimizedImageUrl(activeSrc, widths[Math.min(1, widths.length - 1)] || 400, 'auto', 75)
    : activeSrc;

  return (
    <picture className={pictureClassName}>
      {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
      {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
      <img
        src={fallbackImgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        className={className}
        onClick={onClick}
        onError={() => {
          if (fallbackSrc && activeSrc !== fallbackSrc) {
            setActiveSrc(fallbackSrc);
          } else {
            setHasError(true);
          }
        }}
      />
    </picture>
  );
};
