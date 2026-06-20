import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. CORS STREAM PROXY ENDPOINT
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;

    if (!targetUrl) {
      return res.status(400).send("Falta parámetro 'url' en la consulta.");
    }

    try {
      const decodedUrl = decodeURIComponent(targetUrl);
      
      // Perform stream fetching (Native fetch in Node 18+ follows redirects automatically)
      const response = await fetch(decodedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*"
        }
      });

      if (!response.ok) {
        return res.status(response.status).send(`Error al conectar con origen: ${response.statusText}`);
      }

      // Add necessary CORS Headers to allow playback on our client browser
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");

      // Resolve final URL in case of redirects to ensure correct parent path reference
      const finalUrl = response.url || decodedUrl;
      const urlObj = new URL(finalUrl);

      // Determine Content-Type
      const contentType = response.headers.get("content-type") || "";
      const isM3U8 = contentType.includes("mpegurl") || 
                     contentType.includes("x-mpegurl") || 
                     contentType.includes("mpegURL") || 
                     decodedUrl.toLowerCase().split('?')[0].endsWith(".m3u8");

      if (isM3U8) {
        // Read text and parse line-by-line to rewrite paths
        const text = await response.text();
        const lines = text.split("\n");

        const rewrittenLines = lines.map(line => {
          let processed = line;

          // 1. Rewrite any embedded tag URIs (e.g. key manifestos, init chunks)
          if (processed.startsWith("#")) {
            const uriRegex = /(URI=["'])([^"']*)(["'])/g;
            processed = processed.replace(uriRegex, (match, prefix, pathVal, suffix) => {
              if (pathVal.startsWith("http://") || pathVal.startsWith("https://") || pathVal.startsWith("data:")) {
                return `${prefix}/api/proxy?url=${encodeURIComponent(pathVal)}${suffix}`;
              }
              // It's relative, resolve it
              try {
                let absoluteUrl = "";
                if (pathVal.startsWith("/")) {
                  absoluteUrl = `${urlObj.protocol}//${urlObj.host}${pathVal}`;
                } else {
                  const pathSegments = urlObj.pathname.split("/");
                  pathSegments.pop(); // remove file component
                  const parentPath = pathSegments.join("/");
                  absoluteUrl = `${urlObj.protocol}//${urlObj.host}${parentPath}/${pathVal}`;
                }
                return `${prefix}/api/proxy?url=${encodeURIComponent(absoluteUrl)}${suffix}`;
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

          // 2. Rewrite streaming track links
          let absoluteUrl = "";
          try {
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
              absoluteUrl = trimmed;
            } else if (trimmed.startsWith("/")) {
              absoluteUrl = `${urlObj.protocol}//${urlObj.host}${trimmed}`;
            } else {
              const pathSegments = urlObj.pathname.split("/");
              pathSegments.pop(); // remove file segment (e.g., index.m3u8)
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
        // Feed chunk stream binaries (e.g. .ts blobs and audio arrays)
        if (contentType) {
          res.setHeader("Content-Type", contentType);
        }

        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          res.setHeader("Content-Length", contentLength);
        }

        // Stream reader loop to push chunks sequentially without clogging RAM heap memory
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
    } catch (err: any) {
      console.error("CORS Proxy Failure:", err);
      return res.status(500).send(`Fallo en el proxy CORS: ${err.message}`);
    }
  });

  // 2. PRODUCTION SERVING VS DEVELOPMENT HMR WRAPPER 
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
