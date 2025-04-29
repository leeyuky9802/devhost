import https from "https";
import http from "http";
import { createSecureContext } from "tls";
import { loadCertsForDomain } from "#lib/mkcert";
import { proxyRouter } from "#lib/proxy-router";
import type { Protocol } from "#lib/schemas";

const portServerMap = new Map<number, https.Server | http.Server>();

function closeAndDeleteAllProxyServers() {
  portServerMap.forEach((server) => {
    server.closeAllConnections();
    server.close();
  });
  portServerMap.clear();
}

async function listenServer(port: number, server: https.Server | http.Server) {
  return new Promise<void>((resolve, reject) => {
    server.listen(port, resolve);
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EACCES") {
        reject(new Error(`Port ${port} requires admin privileges`));
      } else if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(new Error(`Unknown error when listening port ${port}`));
      }
    });
  });
}

function createServer(protocol: Protocol) {
  return protocol === "https"
    ? https.createServer(
        {
          SNICallback: (domain, cb) => {
            const { key, cert } = loadCertsForDomain(domain);
            cb(null, createSecureContext({ key, cert }));
          },
        },
        proxyRouter
      )
    : http.createServer(proxyRouter);
}

async function startProxyServers(
  params: { port: number; protocol: Protocol }[]
) {
  closeAndDeleteAllProxyServers();

  // pupulate the map and listen to the ports
  for (const { port, protocol } of params) {
    const server = createServer(protocol);
    portServerMap.set(port, server);
    await listenServer(port, server);
  }
}

export { startProxyServers, closeAndDeleteAllProxyServers };
