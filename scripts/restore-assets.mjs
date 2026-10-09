import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// The GitHub transfer stores the original large PNGs in small text parts.
// No network request, image conversion, or paid service is used to restore them.
const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(new URL("../source-assets/manifest.json", import.meta.url), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function insideRoot(relativePath) {
  const absolute = resolve(root, relativePath);
  if (!absolute.startsWith(root.endsWith(sep) ? root : root + sep)) {
    throw new Error("Asset path is outside the project.");
  }
  return absolute;
}

if (manifest.version !== 1 || !Array.isArray(manifest.assets)) {
  throw new Error("Unsupported source asset manifest.");
}
for (const asset of manifest.assets) {
  const destination = insideRoot(asset.path);
  if (existsSync(destination)) {
    const current = readFileSync(destination);
    if (current.length === asset.bytes && sha256(current) === asset.sha256) continue;
    throw new Error(`${asset.path} differs from the saved original. Move it before restoring.`);
  }
  const encoded = asset.parts.map((part) => readFileSync(insideRoot(part), "utf8")).join("");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    throw new Error(`Invalid encoded asset: ${asset.path}`);
  }
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length !== asset.bytes || sha256(bytes) !== asset.sha256) {
    throw new Error(`Source asset integrity check failed: ${asset.path}`);
  }
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = destination + `.restore-${process.pid}`;
  writeFileSync(temporary, bytes, { flag: "wx" });
  renameSync(temporary, destination);
  console.log(`Restored ${asset.path} (${bytes.length} bytes).`);
}
