#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const appDir = process.env.APP_DIR || path.join(__dirname, "..");
const text = fs.readFileSync(path.join(appDir, ".env"), "utf8");
const line = text.split("\n").find((l) => l.startsWith("DATABASE_URL="));
if (!line) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
let v = line.slice("DATABASE_URL=".length).trim();
v = v.replace(/^["']|["']$/g, "");
const u = new URL(v.replace(/^mysql:\/\//i, "http://"));
const q = JSON.stringify;
console.log("export MD_HOST=" + q(u.hostname));
console.log("export MD_PORT=" + q(u.port || "3306"));
console.log("export MD_USER=" + q(decodeURIComponent(u.username)));
console.log("export MD_PASS=" + q(decodeURIComponent(u.password)));
console.log("export MD_DB=" + q(u.pathname.replace(/^\//, "")));
