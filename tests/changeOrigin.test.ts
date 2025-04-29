import { loadCertsForDomain } from "#lib/mkcert";

import { createProxyMiddleware } from "http-proxy-middleware";
import express from "express";
import https from "https";
import type { Origin } from "#lib/schemas";

const targetOrigin: Origin = {
  host: "www.google.com",
  port: 443,
  protocol: "https",
};

const agent = new https.Agent({
  servername: targetOrigin.host,
});

// Create the proxy
const proxyMiddleware = createProxyMiddleware({
  target: "https://www.google.com",
  changeOrigin: false,
  agent,
  xfwd: false,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader("host", "www.google.com");
    },
  },
});

https
  .createServer(
    loadCertsForDomain("www.example.com"),
    express().use("/", proxyMiddleware)
  )
  .listen(8443);
