import https from "https";
import { createProxyMiddleware } from "http-proxy-middleware";
import net from "net";

import type { Proxy, Target } from "#lib/schemas";
import { getDoh, getURLFromOrigin } from "#lib/utils";
import type { ClientRequest, IncomingMessage } from "http";

function hanldeHeaderReplacements(
  target: Target,
  middlewareStatus: {
    requestCount: number;
  },
  proxyReq: ClientRequest,
  req: IncomingMessage
) {
  middlewareStatus.requestCount = middlewareStatus.requestCount + 1;
  const wipHeaderMap = new Map<string, string[]>();
  target.headerReplaces.forEach((headerReplace) => {
    // get wip header value
    let wipHeaderValue = wipHeaderMap.get(headerReplace.name);

    // if the header is not in the map, get it from the request
    if (!wipHeaderValue) {
      const reqHeaderValue = req.headers[headerReplace.name];
      if (typeof reqHeaderValue === "string") {
        wipHeaderValue = [reqHeaderValue];
      } else if (Array.isArray(reqHeaderValue)) {
        wipHeaderValue = reqHeaderValue;
      } else {
        wipHeaderValue = [""];
      }
    }

    wipHeaderMap.set(
      headerReplace.name,
      wipHeaderValue.map((headerValue) => {
        return headerValue.replace(
          new RegExp(headerReplace.pattern, headerReplace.flags),
          headerReplace.replacement
        );
      })
    );
  });

  wipHeaderMap.forEach((headerValue, headerName) => {
    if (headerValue.length === 0) return;
    if (headerValue.length === 1 && headerValue[0] === "") return;

    proxyReq.setHeader(headerName, headerValue);
  });
}

async function createMiddlewareClosure(proxy: Proxy, target: Target) {
  // get middleware's targetURL
  let targetURL: string;
  let agent: https.Agent | undefined = undefined;
  if (
    !net.isIP(target.origin.host) && // must not be an IP address
    target.origin.host !== "localhost" // must not be localhost
  ) {
    const ipv4Address = await getDoh(target.origin.host);

    if (!ipv4Address) {
      throw new Error(
        "Failed to resolve" + target.origin.host + ": no ipv4 address found"
      );
    }

    targetURL = getURLFromOrigin({
      ...target.origin,
      host: ipv4Address,
    });

    agent = new https.Agent({
      servername: target.origin.host,
      lookup: async (dnsName, options, callback) => {
        callback(null, ipv4Address, 4);
      },
    });
  } else {
    targetURL = getURLFromOrigin(target.origin);
    agent = undefined;
  }

  const middlewareStatus = {
    requestCount: 0,
    proxy: proxy,
    target: target,
  };

  const proxyMiddleware = createProxyMiddleware({
    xfwd: false,
    target: targetURL,
    ws: true,
    agent,
    changeOrigin: false,
    on: {
      proxyReq: hanldeHeaderReplacements.bind(null, target, middlewareStatus),
      proxyReqWs: hanldeHeaderReplacements.bind(null, target, middlewareStatus),
    },
  });

  return {
    proxyMiddleware,
    middlewareStatus,
  };
}

export { createMiddlewareClosure };
