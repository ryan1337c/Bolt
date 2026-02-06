/**
 * Copies the Remotion-rendered hero video into public/ for the landing page.
 * Run from repo root after: cd omni-hero-video && npm run render:hero
 */
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const src = path.join(repoRoot, "omni-hero-video", "out", "OmniDemoHero.mp4");
const dest = path.join(repoRoot, "public", "OmniDemoHero.mp4");

if (!fs.existsSync(src)) {
  console.error("Rendered video not found. First run:");
  console.error("  cd omni-hero-video && npm run render:hero");
  console.error("Expected file:", src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log(
  "Copied omni-hero-video/out/OmniDemoHero.mp4 -> public/OmniDemoHero.mp4"
);
