var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Falta par\xE1metro 'url' en la consulta.");
  }
  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });
    if (!response.ok) {
      return res.status(response.status).send(`Error al conectar con origen: ${response.statusText}`);
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    const finalUrl = response.url || decodedUrl;
    const urlObj = new URL(finalUrl);
    const contentType = response.headers.get("content-type") || "";
    const isM3U8 = contentType.includes("mpegurl") || contentType.includes("x-mpegurl") || contentType.includes("mpegURL") || decodedUrl.toLowerCase().split("?")[0].endsWith(".m3u8");
    if (isM3U8) {
      const text = await response.text();
      const lines = text.split("\n");
      const rewrittenLines = lines.map((line) => {
        let processed = line;
        if (processed.startsWith("#")) {
          const uriRegex = /(URI=["'])([^"']*)(["'])/g;
          processed = processed.replace(uriRegex, (match, prefix, pathVal, suffix) => {
            if (pathVal.startsWith("http://") || pathVal.startsWith("https://") || pathVal.startsWith("data:")) {
              return `${prefix}/api/proxy?url=${encodeURIComponent(pathVal)}${suffix}`;
            }
            try {
              let absoluteUrl2 = "";
              if (pathVal.startsWith("/")) {
                absoluteUrl2 = `${urlObj.protocol}//${urlObj.host}${pathVal}`;
              } else {
                const pathSegments = urlObj.pathname.split("/");
                pathSegments.pop();
                const parentPath = pathSegments.join("/");
                absoluteUrl2 = `${urlObj.protocol}//${urlObj.host}${parentPath}/${pathVal}`;
              }
              return `${prefix}/api/proxy?url=${encodeURIComponent(absoluteUrl2)}${suffix}`;
            } catch {
              return match;
            }
          });
          return processed;
        }
        const trimmed = processed.trim();
        if (trimmed === "") {
          return processed;
        }
        let absoluteUrl = "";
        try {
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            absoluteUrl = trimmed;
          } else if (trimmed.startsWith("/")) {
            absoluteUrl = `${urlObj.protocol}//${urlObj.host}${trimmed}`;
          } else {
            const pathSegments = urlObj.pathname.split("/");
            pathSegments.pop();
            const parentPath = pathSegments.join("/");
            absoluteUrl = `${urlObj.protocol}//${urlObj.host}${parentPath}/${trimmed}`;
          }
          return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        } catch {
          return processed;
        }
      });
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(rewrittenLines.join("\n"));
    } else {
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        return res.end();
      } else {
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    }
  } catch (err) {
    console.error("CORS Proxy Failure:", err);
    return res.status(500).send(`Fallo en el proxy CORS: ${err.message}`);
  }
});
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite development middleware mounted successfully.");
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
    console.log(`[Server] Production asset server active at ${distPath}`);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Streamflow online on http://localhost:${PORT}`);
  });
}
bootstrap();
//# sourceMappingURL=server.cjs.map
