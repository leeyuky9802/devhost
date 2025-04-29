import path from "path";
import fs, { readFileSync } from "fs";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import chalk from "chalk";

let currentDir: string;

try {
  const __filename = fileURLToPath(import.meta.url);
  currentDir = dirname(__filename);
  // console.log("Using ESM path logic");
} catch {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Expecting __dirname to be defined in CJS context/bundle
  currentDir = __dirname;
}

const MKCERT_PATH = path.join(
  currentDir,
  "../bin",
  process.platform + "-" + process.arch
);

/**
 * The path to the dir of certs
 * when it's root, ~/.devhost/root
 * when it's user, ~/.devhost/user
 */
const CERT_DIR = path.join(os.homedir(), ".devhost");

/**
 * Returns [certPath, keyPath] for the given domain
 */
function getCertsPath(domainname: string): [string, string] {
  return [
    path.join(CERT_DIR, domainname + ".pem"),
    path.join(CERT_DIR, domainname + ".key.pem"),
  ];
}

function deleteCertsDir() {
  fs.rmSync(CERT_DIR, {
    recursive: true,
    force: true,
  });
  console.log(chalk.dim("✔ deleted generated certificates"));
}

/**
 * Create the certs dir if it doesn't exist
 */
function createCertsDir() {
  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
  }
}

/**
 * Returns { cert: certFile, key: keyFile } for the given domain
 */
function loadCertsForDomain(domainName: string) {
  const [certPath, keyPath] = getCertsPath(domainName);

  if (!(fs.existsSync(certPath) && fs.existsSync(keyPath))) {
    createCertsDir();
    // makr sure mkcert is installed
    const mkcertInstallResult = spawnSync(MKCERT_PATH, ["-install"]);
    if (mkcertInstallResult.error) {
      throw new Error(
        `mkcert install failed: ${mkcertInstallResult.error.name} ${mkcertInstallResult.error.message}`
      );
    }

    if (mkcertInstallResult.status !== 0) {
      throw new Error(
        `mkcert install failed: exit code: ${
          mkcertInstallResult.status
        } ${mkcertInstallResult.stderr.toString()}`
      );
    }

    // if the certs and keys don't exist locally, create them
    const mkcertCreateResult = spawnSync(MKCERT_PATH, [
      "-cert-file",
      certPath,
      "-key-file",
      keyPath,
      domainName,
    ]);

    if (mkcertCreateResult.error) {
      throw new Error(
        `create certificate for domain name ${domainName} failed: ${mkcertCreateResult.error.name} ${mkcertCreateResult.error.message}`
      );
    }

    if (mkcertCreateResult.status !== 0) {
      throw new Error(
        `create certificate for domain name ${domainName} failed: exit code: ${
          mkcertCreateResult.status
        } ${mkcertCreateResult.stderr.toString()}`
      );
    }
  }

  return {
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  };
}

export { loadCertsForDomain, deleteCertsDir };
