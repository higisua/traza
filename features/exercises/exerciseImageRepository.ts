/**
 * Exercise image associations — paths only, never binary blobs in localStorage.
 *
 * Limitation (documented): large images must live under /public/exercises or
 * as external URLs later. localStorage only stores the path string on Exercise.
 * New user images: pick an existing catalog path, or leave empty (placeholder).
 * Binary upload persistence is out of scope until a proper file store exists.
 */

export const EXERCISE_IMAGE_PLACEHOLDER = "/exercises/_placeholder.svg";

/** Built-in catalog images shipped with the 29 seed exercises. */
export const CATALOG_IMAGE_PATHS: readonly string[] = [
  "/exercises/hack-squat.png",
  "/exercises/machine-chest-press.png",
  "/exercises/chest-supported-row.png",
  "/exercises/seated-leg-curl.png",
  "/exercises/machine-lateral-raise.png",
  "/exercises/rope-triceps-pushdown.png",
  "/exercises/leg-press-calf-raise.png",
  "/exercises/elliptical.png",
  "/exercises/smith-romanian-deadlift.png",
  "/exercises/machine-incline-chest-press.png",
  "/exercises/neutral-grip-lat-pulldown.png",
  "/exercises/leg-press.png",
  "/exercises/machine-shoulder-press.png",
  "/exercises/cable-biceps-curl.png",
  "/exercises/cable-crunch.png",
  "/exercises/leg-extension.png",
  "/exercises/machine-hip-thrust.png",
  "/exercises/pec-deck.png",
  "/exercises/high-row-machine.png",
  "/exercises/lateral-raise.png",
  "/exercises/reverse-pec-deck.png",
  "/exercises/preacher-curl.png",
  "/exercises/overhead-triceps-extension.png",
  "/exercises/standing-calf-raise.png",
  "/exercises/pallof-press.png",
  "/exercises/push-up.png",
  "/exercises/reverse-lunge.png",
  "/exercises/single-leg-calf-raise.png",
  "/exercises/side-plank.png",
] as const;

export const ExerciseImageRepository = {
  listCatalogPaths(): readonly string[] {
    return CATALOG_IMAGE_PATHS;
  },

  resolveDisplayPath(imagePath: string | null | undefined): string {
    if (imagePath && imagePath.trim()) return imagePath;
    return EXERCISE_IMAGE_PLACEHOLDER;
  },

  isCatalogPath(path: string): boolean {
    return (CATALOG_IMAGE_PATHS as readonly string[]).includes(path);
  },
};
