import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { CHROMA_KEY_CONFIG } from "../config/chroma-key.config.mjs";
import { getAssetDefinitions } from "../public/game/config/assets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "processed-assets");
const PUBLIC_OUTPUT_DIR = path.join(ROOT_DIR, "public", "processed-assets");
const ASSET_DEFINITIONS = [...new Map(
  ["s1", "s2"]
    .flatMap((seasonId) => getAssetDefinitions(seasonId))
    .map((definition) => [`${definition.file}::${definition.sourceFile || ""}`, definition])
).values()];
const STATIC_PUBLIC_ASSETS = [
  "scene/c0.png",
  ...ASSET_DEFINITIONS.filter((definition) => !definition.chromaKey).map((definition) => definition.file)
];
const STATIC_PROCESSED_ASSETS = [
  "special/intro_figure.png",
  "special/thumbnail_mobile.png",
  "special/thumbnail_raw.png"
];

async function writePng(pixelBuffer, info, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(pixelBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  }).png().toFile(outputPath);
}

function softenGreenOutline(pixelBuffer, info) {
  const { width, height, channels } = info;
  const alphaAt = (x, y) => pixelBuffer[(y * width + x) * channels + 3];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * channels;
      const red = pixelBuffer[index];
      const green = pixelBuffer[index + 1];
      const blue = pixelBuffer[index + 2];
      const alpha = pixelBuffer[index + 3];

      if (alpha < 220 || green <= Math.max(red, blue) + 14) {
        continue;
      }

      let touchesTransparentEdge = false;

      for (let offsetY = -1; offsetY <= 1 && !touchesTransparentEdge; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) {
            continue;
          }

          if (alphaAt(x + offsetX, y + offsetY) === 0) {
            touchesTransparentEdge = true;
            break;
          }
        }
      }

      if (!touchesTransparentEdge) {
        continue;
      }

      pixelBuffer[index + 1] = Math.min(green, Math.max(red, blue) + 2);
    }
  }
}

function applyChromaKey(pixelBuffer, info) {
  let transparentPixels = 0;

  for (let index = 0; index < pixelBuffer.length; index += 4) {
    const red = pixelBuffer[index];
    const green = pixelBuffer[index + 1];
    const blue = pixelBuffer[index + 2];
    const strongestOther = Math.max(red, blue);

    if (green > CHROMA_KEY_CONFIG.minGreen && green > strongestOther * CHROMA_KEY_CONFIG.dominanceRatio) {
      const distance = green - strongestOther;
      const nextAlpha = distance > CHROMA_KEY_CONFIG.fullTransparentDistance
        ? 0
        : Math.max(0, 255 - distance * CHROMA_KEY_CONFIG.fadeMultiplier);

      if (nextAlpha === 0) {
        pixelBuffer[index] = 0;
        pixelBuffer[index + 1] = 0;
        pixelBuffer[index + 2] = 0;
      } else if (nextAlpha < 255) {
        const neutralGreen = Math.round((red + blue) / 2);
        const despillTarget = nextAlpha <= 192
          ? neutralGreen
          : Math.min(strongestOther + 4, neutralGreen + 6);

        pixelBuffer[index + 1] = Math.min(pixelBuffer[index + 1], despillTarget);
      }

      if (nextAlpha !== pixelBuffer[index + 3]) {
        transparentPixels += 1;
      }

      pixelBuffer[index + 3] = nextAlpha;
    }
  }

  return transparentPixels;
}

async function processAsset(definition) {
  const inputPath = path.join(ROOT_DIR, definition.sourceFile || definition.file);
  const outputPath = path.join(OUTPUT_DIR, definition.file);
  const publicOutputPath = path.join(PUBLIC_OUTPUT_DIR, definition.file);
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelBuffer = Buffer.from(data);
  const transparentPixels = applyChromaKey(pixelBuffer, info);
  softenGreenOutline(pixelBuffer, info);

  await writePng(pixelBuffer, info, outputPath);
  await writePng(pixelBuffer, info, publicOutputPath);

  return {
    key: definition.key,
    file: definition.file,
    sourceFile: definition.sourceFile || definition.file,
    transparentPixels
  };
}

async function copyStaticAsset(relativePath) {
  const sourcePath = path.join(ROOT_DIR, relativePath);
  const targetPath = path.join(ROOT_DIR, "public", relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
  return relativePath;
}

async function copyProcessedStaticAsset(relativePath) {
  const sourceCandidates = [
    path.join(ROOT_DIR, relativePath),
    path.join(PUBLIC_OUTPUT_DIR, relativePath)
  ];
  const sourcePath = await sourceCandidates.reduce(async (resolvedPromise, candidatePath) => {
    const resolved = await resolvedPromise;
    if (resolved) {
      return resolved;
    }

    try {
      await fs.access(candidatePath);
      return candidatePath;
    } catch {
      return "";
    }
  }, Promise.resolve(""));

  if (!sourcePath) {
    throw new Error(`Missing processed static asset source: ${relativePath}`);
  }

  const outputPath = path.join(OUTPUT_DIR, relativePath);
  const publicOutputPath = path.join(PUBLIC_OUTPUT_DIR, relativePath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(path.dirname(publicOutputPath), { recursive: true });
  await fs.copyFile(sourcePath, outputPath);
  await fs.copyFile(sourcePath, publicOutputPath);
  return relativePath;
}

async function main() {
  const targets = ASSET_DEFINITIONS.filter((definition) => definition.chromaKey);
  const report = [];

  for (const definition of targets) {
    report.push(await processAsset(definition));
  }

  const reportPath = path.join(OUTPUT_DIR, "chroma-key-report.json");
  await fs.writeFile(reportPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    config: CHROMA_KEY_CONFIG,
    assets: report
  }, null, 2)}\n`, "utf8");

  await Promise.all([...new Set(STATIC_PUBLIC_ASSETS)].map(copyStaticAsset));
  await Promise.all([...new Set(STATIC_PROCESSED_ASSETS)].map(copyProcessedStaticAsset));

  console.log(`Processed ${report.length} chroma-key assets into ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
