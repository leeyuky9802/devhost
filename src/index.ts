// import { checkOS, checkDevhostPort } from "#libs/checks";
// import { checkHostsAccess } from "#libs/hosts";
// import { mkcertInit } from "#libs/mkcert";
// import { createDevhostServer } from "#src/devhost";

async function main() {
  if (__dev__) {
    console.log("Running in dev mode");
  }

  // // check if os is supported
  // await checkOS();

  // // mkcert
  // await checkHostsAccess();
  // await mkcertInit();

  // // devhost
  // const devhost_port = await checkDevhostPort();
  // await createDevhostServer(devhost_port);
}

main();
