/**
 * Wide logo -> square app icons (Android adaptive icon safe zone).
 * Run: node scripts/generate-app-icons.mjs
 */
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "assets/images/logo-brand.png");
const outDir = join(root, "assets/images");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("sharp o'rnatilmagan. npm install sharp --save-dev");
    process.exit(1);
  }
  if (!existsSync(src)) {
    console.error("logo-brand.png topilmadi:", src);
    process.exit(1);
  }

  const size = 1024;
  const padding = Math.round(size * 0.12);
  const inner = size - padding * 2;

  const logo = sharp(src).resize(inner, inner, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } });
  const logoBuf = await logo.png().toBuffer();

  const square = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logoBuf, gravity: "center" }])
    .png()
    .toBuffer();

  const names = ["icon.png", "adaptive-icon.png", "splash-icon.png", "favicon.png"];
  for (const name of names) {
    await sharp(square).toFile(join(outDir, name));
    console.log("Yozildi:", name);
  }
  console.log("Tayyor — kvadrat ikonlar (1024x1024, markazda logo).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
