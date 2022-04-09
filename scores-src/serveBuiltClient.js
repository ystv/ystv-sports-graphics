const http = require("http");
const httpProxy = require("http-proxy");
const serveHandler = require("serve-handler");
const path = require("path");
const { URL } = require("url");

const port = 3000;

const proxy = httpProxy.createProxyServer({
  target: "http://localhost:8000",
  ws: true,
});

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
const handler = async (req, res) => {
  console.log(req.method, req.url);
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname.startsWith("/api")) {
    proxy.web(req, res);
    return;
  }
  await serveHandler(req, res, {
    public: path.join(__dirname, "dist"),
    cleanUrls: true,
    rewrites: [{ source: "/**/**", destination: "/index.html" }],
  });
};

const server = http.createServer(handler);

server.listen(port, () => {
  console.log(`Serving built client on http://localhost:${port}`);
});
