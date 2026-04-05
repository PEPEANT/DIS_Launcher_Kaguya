export const SNACK_RUSH_SOURCE_ROOT = "assets/source/games/snack-rush";

export function getSnackRushSourceFile(relativePath) {
  const normalizedPath = String(relativePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  return `${SNACK_RUSH_SOURCE_ROOT}/${normalizedPath}`;
}
