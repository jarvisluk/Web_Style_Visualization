import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

function devCorsProxy() {
  return {
    name: "dev-cors-proxy",
    configureServer(server) {
      server.middlewares.use("/__cors", (req, res, next) => {
        const targetUrl = decodeURIComponent(req.url.slice(1));
        if (!targetUrl.startsWith("http")) return next();

        if (req.method === "OPTIONS") {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
          });
          res.end();
          return;
        }

        const target = new URL(targetUrl);
        const client = target.protocol === "https:" ? httpsRequest : httpRequest;

        const fwdHeaders = { ...req.headers };
        delete fwdHeaders.host;
        delete fwdHeaders.origin;
        delete fwdHeaders.referer;
        fwdHeaders.host = target.host;

        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
          const body = Buffer.concat(chunks);
          const proxyReq = client(
            target,
            { method: req.method, headers: fwdHeaders },
            (proxyRes) => {
              const h = { ...proxyRes.headers };
              h["access-control-allow-origin"] = "*";
              h["access-control-allow-methods"] = "*";
              h["access-control-allow-headers"] = "*";
              res.writeHead(proxyRes.statusCode, h);
              proxyRes.pipe(res);
            }
          );
          proxyReq.on("error", (e) => {
            res.writeHead(502);
            res.end(e.message);
          });
          if (body.length) proxyReq.write(body);
          proxyReq.end();
        });
      });
    },
  };
}

export default {
  base: "/Web_Style_Visualization/",
  build: {
    outDir: "dist",
  },
  plugins: [devCorsProxy()],
};
