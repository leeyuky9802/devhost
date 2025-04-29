import chalk from "chalk";
import express from "express";
import cors from "cors";
import https from "https";
import type {
  DevhostServerResponse,
  DevhostServerError,
  Proxy,
  Target,
  Protocol,
} from "#lib/schemas";
import { proxiesSchema } from "#lib/schemas";
import { decrypt } from "#lib/crypto";

import { deleteCertsDir, loadCertsForDomain } from "#lib/mkcert";
import { updateHosts, checkHostsAccess, resetHosts } from "#lib/hosts";
import {
  startProxyServers,
  closeAndDeleteAllProxyServers,
} from "#lib/proxy-https-server";
import { updateProxyRouter } from "#lib/proxy-router";

function cleanUpAndQuit() {
  resetHosts();
  deleteCertsDir();
  closeAndDeleteAllProxyServers();
  console.log(chalk.dim("devhost stopped gracefully"));
  process.exit(0);
}

const app = express()
  .use(cors({ origin: ["https://suntzu.me"] }))
  .use(express.text())
  .post("/", async (req, res) => {
    try {
      const proxies = proxiesSchema.parse(
        JSON.parse(await decrypt(req.body, "localhost"))
      );

      // hosts
      const enabledProxies = proxies.filter((group) => group.enabled === true);
      updateHosts(enabledProxies.map((group) => group.origin.host));

      // router
      const proxyTargetPairs: { proxy: Proxy; target: Target }[] = [];
      enabledProxies.forEach((proxy) => {
        if (proxy.enabledSchemaId) {
          const target = proxy.targets.find(
            (target) => target.id === proxy.enabledSchemaId
          );

          if (target) {
            proxyTargetPairs.push({
              proxy,
              target,
            });
          }
        }
      });
      await updateProxyRouter(proxyTargetPairs);

      // servers
      const portProtocolMap = new Map<number, Protocol>();
      enabledProxies.forEach((proxy) => {
        portProtocolMap.set(proxy.origin.port, proxy.origin.protocol);
      });
      await startProxyServers(
        Array.from(portProtocolMap.entries()).map(([port, protocol]) => ({
          port,
          protocol,
        }))
      );

      // generate response
      const responseBody: DevhostServerResponse = {
        status: "success",
      };
      res.json(responseBody);
    } catch (e) {
      const responseBody: DevhostServerResponse = {
        status: "error",
        message: (e as Error).message,
      };
      res.json(responseBody);
      cleanUpAndQuit();
    }
  });
// .get("/", (req, res) => {
//   try {
//     const proxyId = req.query.proxyId;

//     if (typeof proxyId !== "string") throw new Error("proxyId is required");

//     const count = getRequestCountByProxyId(parseInt(proxyId));

//     res.json({
//       count: count,
//     });
//   } catch {
//     const responseBody: DevhostServerResponse = {
//       status: "error",
//       message: "error",
//     };
//     res.json(responseBody);
//   }
// });

try {
  console.log(chalk.blue("✔ Devhost starting..."));

  console.log(chalk.blue("✔ Checking Hosts file access..."));
  checkHostsAccess();

  console.log(chalk.blue("✔ Checking mkcert installation..."));
  loadCertsForDomain("localhost");
} catch (e) {
  console.error(chalk.red((e as Error).message));
  console.error(chalk.blue((e as DevhostServerError).command));
  cleanUpAndQuit();
}

const server = https.createServer(loadCertsForDomain("localhost"), app);

server.listen(24601, () => {
  console.log(chalk.green("✔ Devhost started"));
  process.stdin.setRawMode(true);
  console.log(chalk.yellow("press q to exit & clean up"));
  console.log(
    chalk.yellow(
      "press Ctrl+C to exit & save Hosts entries.\nyou can always requit with q to clean up"
    )
  );
  process.stdin.resume();
  process.stdin.on("data", function (data) {
    const key = data.toString();
    if (key === "q") cleanUpAndQuit();
    else if (key === "\u0003") {
      deleteCertsDir();
      closeAndDeleteAllProxyServers();
      console.log(chalk.dim("devhost stopped gracefully"));
      process.exit(0);
    }
  });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EACCES") {
    console.error(
      chalk.red(
        "✘ Devhost failed to start: Permission denied when binding to port 24601"
      )
    );
  } else if (err.code === "EADDRINUSE") {
    console.error(
      chalk.red(
        "✘ Devhost failed to start: Port is already taken when binding to port 24601"
      )
    );
  } else {
    console.error(chalk.red("✘ Devhost failed to start: " + err.message));
  }
  cleanUpAndQuit();
});
