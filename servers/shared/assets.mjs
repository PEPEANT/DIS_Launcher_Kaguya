import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

const ALLOWED_ASSET_DIRS = new Set(["scene", "character", "item", "special"]);

export function isAllowedAssetPath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const match = normalized.match(/^([A-Za-z0-9_-]+)\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(png|jpg|jpeg)$/u);
  return Boolean(match && ALLOWED_ASSET_DIRS.has(match[1]));
}

export async function resolvePublicFile(publicDir, urlPath) {
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const resolvedPath = path.resolve(publicDir, `.${requestedPath}`);

  if (!resolvedPath.startsWith(publicDir)) {
    return null;
  }

  try {
    const stats = await fs.stat(resolvedPath);
    if (stats.isFile()) {
      return resolvedPath;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(resolvedPath, "index.html");
      const indexStats = await fs.stat(indexPath);
      return indexStats.isFile() ? indexPath : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function resolveAssetFile(baseDir, relativePath, extraBaseDirs = []) {
  if (!isAllowedAssetPath(relativePath)) {
    return null;
  }

  const normalized = relativePath.replace(/\\/g, "/");

  for (const candidateBaseDir of [baseDir, ...extraBaseDirs]) {
    const absolutePath = path.resolve(candidateBaseDir, normalized);
    if (absolutePath.startsWith(candidateBaseDir) && existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return null;
}
