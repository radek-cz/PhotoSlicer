/** Lazily initializes OpenCV and shares its loading promise across operations. */
import { loadOpenCV } from "@opencvjs/web";

let cvPromise: ReturnType<typeof loadOpenCV> | null = null;

export function getOpenCV() {
  if (!cvPromise) {
    cvPromise = loadOpenCV();
  }

  return cvPromise;
}