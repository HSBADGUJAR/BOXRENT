"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Container,
  Expand,
  X,
  ZoomIn,
} from "lucide-react";

import type { GalleryImage } from "@/lib/container-images";

type ImageGalleryProps = {
  images: GalleryImage[];
  title: string;
  isAvailable?: boolean;
  containerType?: string;
  fallback?: React.ReactNode;
};

function GalleryPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        <Container className="h-8 w-8 text-white/70" />
      </div>

      <p className="mt-4 text-sm font-semibold text-white/60">
        No images available
      </p>
    </div>
  );
}

export default function ImageGallery({
  images,
  title,
  isAvailable,
  containerType,
  fallback,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const activeIndexRef = useRef(0);
  const imagesLengthRef = useRef(0);

  const hasImages = images.length > 0;
  const activeImage = hasImages ? images[activeIndex] : null;

  const updateIndex = useCallback((index: number) => {
    const length = imagesLengthRef.current;

    if (length === 0) {
      return;
    }

    const next = (index + length) % length;

    activeIndexRef.current = next;
    setActiveIndex(next);
  }, []);

  const goPrev = useCallback(() => updateIndex(activeIndexRef.current - 1), [updateIndex]);
  const goNext = useCallback(() => updateIndex(activeIndexRef.current + 1), [updateIndex]);

  useEffect(() => {
    imagesLengthRef.current = images.length;
  }, [images.length]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  /* Reset when the image set changes */
  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);
    setLightboxOpen(false);
    setIsZoomed(false);
    imagesLengthRef.current = images.length;
  }, [images]);

  /* Keyboard navigation inside the lightbox */
  useEffect(() => {
    if (!lightboxOpen || !hasImages) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
        setIsZoomed(false);
      } else if (event.key === "ArrowLeft") {
        goPrev();
      } else if (event.key === "ArrowRight") {
        goNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, hasImages, goPrev, goNext]);

  function toggleZoom() {
    setIsZoomed((prev) => !prev);
  }

  const mainStage = (
    <div className="relative flex h-[280px] w-full items-center justify-center overflow-hidden bg-slate-100 sm:h-[360px] lg:h-[430px]">
      {activeImage ? (
        <>
          <div
            className={`relative h-full w-full max-w-4xl cursor-zoom-in transition-transform duration-500 ${
              isZoomed ? "scale-105" : "scale-100"
            }`}
            onClick={toggleZoom}
          >
            <img
              src={activeImage.url}
              alt={title}
              className="h-full w-full object-contain p-3 sm:p-5"
              draggable={false}
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

          <button
            type="button"
            onClick={toggleZoom}
            title={isZoomed ? "Zoom out" : "Zoom in"}
            className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </>
      ) : (
        fallback ?? <GalleryPlaceholder />
      )}

      {/* TYPE BADGE */}
      {containerType && (
        <div className="absolute left-5 top-5">
          <span className="inline-flex rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-slate-800 shadow">
            {containerType}
          </span>
        </div>
      )}

      {/* AVAILABILITY */}
      {isAvailable && (
        <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow">
          <CheckCircle2 className="h-4 w-4" />
          Available
        </div>
      )}

      {/* PREV / NEXT */}
      {hasImages && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* COUNTER */}
      {hasImages && images.length > 1 && (
        <div className="absolute bottom-4 left-5 z-10 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {mainStage}

      {/* THUMBNAILS */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-slate-50 p-3">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                type="button"
                key={image.id}
                onClick={() => updateIndex(index)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-16 ${
                  isActive
                    ? "border-teal-600"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={image.url}
                  alt={`${title} - image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 px-4"
          onClick={() => {
            setLightboxOpen(false);
            setIsZoomed(false);
          }}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/80">
                {activeIndex + 1} / {images.length}
              </span>

              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  setIsZoomed(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main image */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <img
                src={activeImage.url}
                alt={title}
                className={`max-h-[60vh] w-full rounded-2xl object-contain transition-transform duration-500 ${
                  isZoomed ? "scale-125 cursor-zoom-out" : "cursor-zoom-in"
                }`}
                onClick={toggleZoom}
                draggable={false}
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-1">
              {images.map((image, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => updateIndex(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      isActive
                        ? "border-teal-400"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
