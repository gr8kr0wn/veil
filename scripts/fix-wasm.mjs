// @lightprotocol/hasher.rs (used by @heliuslabs/spr) references its .wasm files
// next to the browser JS bundles, but ships them one level up. Bundlers resolve
// `new URL("x.wasm", import.meta.url)` statically and fail the build, so copy them.
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "node_modules", "@lightprotocol", "hasher.rs", "dist");
const files = ["light_wasm_hasher_bg.wasm", "hasher_wasm_simd_bg.wasm"];
const targets = ["browser-fat/es", "browser-fat/cjs", "browser-slim/es", "browser-slim/cjs"];

if (!existsSync(root)) {
  console.log("[fix-wasm] hasher.rs not installed, skipping");
  process.exit(0);
}
let copied = 0;
for (const t of targets) {
  const dir = join(root, t);
  if (!existsSync(dir)) continue;
  for (const f of files) {
    const src = join(root, f);
    if (existsSync(src)) {
      copyFileSync(src, join(dir, f));
      copied++;
    }
  }
}
console.log(`[fix-wasm] copied ${copied} wasm file(s) next to browser bundles`);
