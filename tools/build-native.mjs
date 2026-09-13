import { cpSync, mkdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const path of ["index.html", "assets", "game", "prototype"]) cpSync(path, `dist/${path}`, { recursive: true });
