#!/usr/bin/env node
// Package the extension for distribution.
// Stages only the files the extension actually ships (dropping design/, docs/,
// scripts/, screenshots, READMEs, etc.), then zips them with manifest.json at
// the archive root — the layout the Chrome Web Store and "Load unpacked" expect.
//
// Usage:  node scripts/package.mjs
// Output: dist/hotkey-chain/            (unpacked, ready for "Load unpacked")
//         dist/hotkey-chain-v<ver>.zip  (ready to upload to the Web Store)

import { readFileSync, rmSync, mkdirSync, cpSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { join, dirname, sep } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const version = manifest.version;

// Everything the extension loads at runtime. Anything not listed here is dev-only.
const INCLUDE = ["manifest.json", "background.js", "content.js", "options.html", "options.css", "options.js", "_locales", "icons", "assets"];

// Subpaths excluded even when nested under an included dir (docs-only assets).
const EXCLUDE = [join("assets", "screenshot")];

const distRoot = join(root, "dist");
const stage = join(distRoot, "hotkey-chain");

console.log(`Packaging Hotkey Chain v${version} ...`);

// Clean previous output
rmSync(distRoot, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

// Stage included files, skipping excluded subpaths
let missing = [];
for (const item of INCLUDE) {
  const src = join(root, item);
  if (!existsSync(src)) {
    missing.push(item);
    continue;
  }
  cpSync(src, join(stage, item), {
    recursive: true,
    filter: (s) => !EXCLUDE.some((ex) => s === join(root, ex) || s.startsWith(join(root, ex) + sep)),
  });
}
if (missing.length) {
  console.error(`✖ Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

// Zip the *contents* of the stage dir so manifest.json sits at the archive root.
const zipName = `hotkey-chain-v${version}.zip`;
const zipPath = join(distRoot, zipName);

function tryZip() {
  if (process.platform === "win32") {
    // Prefer PowerShell 7 (pwsh) — it writes spec-compliant forward-slash
    // entry names; fall back to Windows PowerShell 5.1.
    const cmd = `Compress-Archive -Path '${join(stage, "*")}' -DestinationPath '${zipPath}' -Force`;
    for (const exe of ["pwsh", "powershell"]) {
      try {
        execFileSync(exe, ["-NoProfile", "-NonInteractive", "-Command", cmd], { stdio: "ignore" });
        return true;
      } catch {
        /* try next */
      }
    }
    return false;
  }
  try {
    execFileSync("zip", ["-r", "-q", zipPath, "."], { cwd: stage, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (tryZip()) {
  console.log(`✔ Unpacked:  dist/${["hotkey-chain"].join("/")}/   (Load unpacked)`);
  console.log(`✔ Zip:       dist/${zipName}   (upload to Chrome Web Store)`);
} else {
  console.log(`✔ Unpacked:  dist/hotkey-chain/   (Load unpacked)`);
  console.warn(`! Could not create the zip automatically (no pwsh/powershell/zip found).`);
  console.warn(`  The unpacked folder above is ready; zip its contents manually if you need an archive.`);
}
