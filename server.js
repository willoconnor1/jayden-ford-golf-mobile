const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

function serve(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch {
    return false;
  }
  return true;
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  const filePath = path.join(DIST, url);

  // Try exact file
  if (serve(res, filePath)) return;

  // Try with .html extension
  if (serve(res, filePath + ".html")) return;

  // Try index.html in directory
  if (serve(res, path.join(filePath, "index.html"))) return;

  // SPA fallback — serve root index.html for client-side routing
  if (serve(res, path.join(DIST, "index.html"))) return;

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Serving Expo web build on port ${PORT}`);
});
