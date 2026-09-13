import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const paths = [
  ...files("prototype/imbattuto")
    .filter((p) => !/(?:\.test\.js|\.mjs|README\.md|offline-assets\.js)$/.test(p))
    .map((p) => `./${p.slice("prototype/imbattuto/".length)}`),
  ...files("game").filter((p) => p.endsWith(".js") && !p.endsWith(".test.js")).map((p) => `../../${p}`),
  ...files("assets").map((p) => `../../${p}`),
].sort();

const hash = createHash("sha256");
for (const path of paths) {
  const diskPath = path.startsWith("../../") ? path.slice(6) : `prototype/imbattuto/${path.slice(2)}`;
  hash.update(path).update(readFileSync(diskPath));
}

writeFileSync("prototype/imbattuto/offline-assets.js",
  `self.OFFLINE_VERSION=${JSON.stringify(hash.digest("hex").slice(0, 12))};self.OFFLINE_ASSETS=${JSON.stringify(paths)};\n`);
console.log(`offline: ${paths.length} file`);
