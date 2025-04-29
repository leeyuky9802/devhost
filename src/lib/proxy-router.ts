import express from "express";
import { getHostHeaderFromOrigin } from "#lib/utils";
import { createMiddlewareClosure } from "#lib/proxy-middleware";

import type { Proxy, Target } from "#lib/schemas";

const hostMiddlewareClosureMap = new Map<
  string,
  Awaited<ReturnType<typeof createMiddlewareClosure>>
>();

async function updateProxyRouter(params: { proxy: Proxy; target: Target }[]) {
  // create a new hostMiddlewareClosureMap
  const newMap = new Map<
    string,
    Awaited<ReturnType<typeof createMiddlewareClosure>>
  >();

  // populate the new map
  for (const { proxy, target } of params) {
    const host = getHostHeaderFromOrigin(proxy.origin);

    // if cached closure exists and reusable, use it, otherwise assign undefined
    let cachedClosure = hostMiddlewareClosureMap.get(host);
    if (
      cachedClosure &&
      (JSON.stringify(cachedClosure.middlewareStatus.proxy.origin) !==
        JSON.stringify(proxy.origin) ||
        JSON.stringify(cachedClosure.middlewareStatus.target.origin) !==
          JSON.stringify(target.origin) ||
        JSON.stringify(cachedClosure.middlewareStatus.target.headerReplaces) !==
          JSON.stringify(target.headerReplaces))
    ) {
      cachedClosure = undefined;
    }

    // if undefined, create a new one
    if (cachedClosure) {
      newMap.set(host, cachedClosure);
    } else {
      newMap.set(host, await createMiddlewareClosure(proxy, target));
    }
  }

  // assign the new map to the hostMiddlewareClosureMap
  hostMiddlewareClosureMap.clear();
  for (const [key, value] of newMap.entries()) {
    hostMiddlewareClosureMap.set(key, value);
  }
}

const proxyRouter = express().use((req, res, next) => {
  if (!req.headers.host) {
    res.status(400).send("missing host header");
    return;
  } else {
    const middleware = hostMiddlewareClosureMap.get(req.headers.host);
    if (!middleware) {
      res.status(404).send("this host is not enabled");
      return;
    }
    middleware.proxyMiddleware(req, res, next);
  }
});

export { updateProxyRouter, proxyRouter };
