import fs from "fs";
import os from "os";
import type { DevhostServerError } from "#lib/schemas";
import chalk from "chalk";

/**
 * Hosts path of different OS
 */
const HOSTS_PATH =
  process.platform === "win32"
    ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
    : "/etc/hosts";

// Marker comments to identify our entries
const START_MARKER = "# START-DEVHOST-ENTRIES";
const END_MARKER = "# END-DEVHOST-ENTRIES";

function checkHostsAccess() {
  try {
    fs.accessSync(HOSTS_PATH, fs.constants.W_OK);
  } catch {
    const error: DevhostServerError = {
      message:
        "Devhost needs write acces to the Hosts file\nplease run the following command to grant access",
      command:
        process.platform === "win32"
          ? `icacls "${HOSTS_PATH}" /grant ${os.userInfo().username}:(W)`
          : `sudo chmod +a 'user:${
              os.userInfo().username
            }:allow write' ${HOSTS_PATH}`,
    };
    throw error;
  }
}

/**
 * Adds a list of domains to the hosts file
 */
function updateHosts(domainName: string[]): void {
  const hostsContent = fs.readFileSync(HOSTS_PATH, "utf-8");
  const lines = hostsContent.split("\n");

  const startIndex = lines.findIndex((line) => line.trim() === START_MARKER);
  const endIndex = lines.findIndex((line) => line.trim() === END_MARKER);

  // Remove existing entries if markers are found
  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    lines.splice(startIndex, endIndex - startIndex + 1);
  }

  lines.push(START_MARKER);
  lines.push(...domainName.map((domain) => `127.0.0.1 ${domain}`));
  lines.push(END_MARKER);
  fs.writeFileSync(HOSTS_PATH, lines.join("\n"));
}

/**
 * Reset the hosts file to remove all entries including the markers
 */
function resetHosts(): void {
  const hostsContent = fs.readFileSync(HOSTS_PATH, "utf-8");
  const lines = hostsContent.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === START_MARKER);
  const endIndex = lines.findIndex((line) => line.trim() === END_MARKER);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) return;

  lines.splice(startIndex, endIndex - startIndex + 1);
  fs.writeFileSync(HOSTS_PATH, lines.join("\n"));
  console.log(chalk.dim("✔ cleared entires in Hosts file"));
}

export { updateHosts, resetHosts, checkHostsAccess };
