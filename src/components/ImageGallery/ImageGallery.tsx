import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useLocalization } from "../../lib/i18n/useLocalization";

import "./ImageGallery.css";

type ImageGalleryProps = {
  images: string[];

  /**
   * Maksymalna szerokość głównego zdjęcia.
   */
  maxWidth?: number;

  /**
   * Maksymalna wysokość głównego zdjęcia.
   */
  maxHeight?: number;

  /**
   * Indeks zdjęcia, które ma być początkowo aktywne.
   */
  initialIndex?: number;

  className?: string;
};

export function ImageGallery({
  images,
  maxWidth = 300,
  maxHeight = 200,
  initialIndex = 0,
  className = "",
}: ImageGalleryProps) {
  const { formatNumber, t } = useLocalization();
  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(0, Math.min(initialIndex, images.length - 1)),
  );

  /*
   * Główna karuzela.
   *
   * dragFree: true
   * -> zdjęcia nie "snapują" do pozycji.
   * -> można je swobodnie przesuwać.
   */
const [mainRef, mainApi] = useEmblaCarousel({
  dragFree: true,
  containScroll: "trimSnaps",
  align: "start",
});

  /*
   * Karuzela miniaturek.
   */
  const [thumbRef, thumbApi] = useEmblaCarousel({
    dragFree: true,
    containScroll: "trimSnaps",
    align: "start",
  });

  /*
   * Kliknięcie thumbnaila.
   */
  const scrollTo = useCallback(
    (index: number) => {
      if (!mainApi) {
        return;
      }

      mainApi.scrollTo(index);
    },
    [mainApi],
  );

  /*
   * Synchronizacja głównej karuzeli
   * z aktywną miniaturą.
   */
  const onSelect = useCallback(() => {
    if (!mainApi) {
      return;
    }

    const index = mainApi.selectedScrollSnap();

    setSelectedIndex(index);

    /*
     * Przewijamy thumbnails tak,
     * żeby aktywna miniatura była widoczna.
     */
    thumbApi?.scrollTo(index);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) {
      return;
    }

    mainApi.on("select", onSelect);

    return () => {
      mainApi.off("select", onSelect);
    };
  }, [mainApi, onSelect]);

  /*
   * Ustawienie początkowego zdjęcia.
   */
  useEffect(() => {
    if (!mainApi || images.length === 0) {
      return;
    }

    const index = Math.max(
      0,
      Math.min(initialIndex, images.length - 1),
    );

    mainApi.scrollTo(index, true);
  }, [mainApi, initialIndex, images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`image-gallery ${className}`}>
      {/* =====================================================
          MAIN CAROUSEL
          ===================================================== */}

<div
  ref={mainRef}
  className="image-gallery__viewport"
>
  <div className="image-gallery__container">
    {images.map((src, index) => (
      <div
        key={`${src}-${index}`}
        className="image-gallery__slide"
      >
        <img
          src={src}
          alt={t("image.gallery.imageAlt", {
            index: formatNumber(index + 1),
          })}
          className="image-gallery__image"
          style={{
            maxWidth: `${maxWidth}px`,
            maxHeight: `${maxHeight}px`,
          }}
          draggable={false}
        />
      </div>
    ))}
  </div>
</div>

      {/* =====================================================
          THUMBNAILS
          ===================================================== */}

      <div
        ref={thumbRef}
        className="image-gallery__thumb-viewport"
      >
        <div className="image-gallery__thumb-container">
          {images.map((src, index) => {
            const isSelected = selectedIndex === index;

            return (
              <button
                key={`${src}-thumb-${index}`}
                type="button"
                className={[
                  "image-gallery__thumb",
                  isSelected
                    ? "image-gallery__thumb--selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => scrollTo(index)}
                aria-label={t("image.gallery.showImage", {
                  index: formatNumber(index + 1),
                })}
                aria-current={isSelected}
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
