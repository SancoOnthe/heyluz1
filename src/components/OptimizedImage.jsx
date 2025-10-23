"use client";
import Image from "next/image";
import { useMemo, useState } from "react";

// Fallback SVG guardado en public (más fácil de mantener que base64)
const FALLBACK_SRC = '/fallback.svg';

export default function OptimizedImage({ className, onError, src, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);

  // Si no hay src válido, devolver null (no pasar cadena vacía a <Image>)
  const safeSrc = useMemo(() => {
    if (!src) return null;
    return broken ? FALLBACK_SRC : src;
  }, [broken, src]);

  return (
    <div className={`oi-wrap ${className || ''}`} style={{ position: 'relative' }}>
      {!loaded && <div className="oi-skeleton" />}

      {safeSrc ? (
        <Image
          {...props}
          src={safeSrc}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            if (!broken) setBroken(true);
            if (onError) onError(e);
          }}
          className={`oi-img ${loaded ? 'oi-img--in' : ''}`}
        />
      ) : (
        // placeholder cuando no hay src (miniatura cuadrada por defecto)
        <div aria-hidden="true" role="img" className={`oi-placeholder ${!loaded ? 'oi-loading' : ''}`} style={{ aspectRatio: '1 / 1' }} />
      )}
    </div>
  );
}
