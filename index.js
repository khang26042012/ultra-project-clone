const path = require("path");
const fs = require("fs");

process.env.PORT = process.env.PORT || "26272";
process.env.HOSTNAME = "0.0.0.0";
process.env.NODE_ENV = "production";
process.chdir(__dirname);

// Load .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("\'") && v.endsWith("\'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

console.log("[AGRIVISION CLONE] Starting Next.js Standalone on port", process.env.PORT, "Node:", process.version);
require(path.join(__dirname, "server.js"));
