import type { Origin } from "#lib/schemas";

function getHostHeaderFromOrigin(origin: Origin): string {
  let host = origin.host;

  if (origin.protocol === "http" && origin.port !== 80) {
    host += `:${origin.port}`;
  } else if (origin.protocol === "https" && origin.port !== 443) {
    host += `:${origin.port}`;
  }

  return host;
}

function getURLFromOrigin(origin: Origin): string {
  let url = `${origin.protocol}://${origin.host}`;

  if (origin.protocol === "http" && origin.port !== 80) {
    url += `:${origin.port}`;
  } else if (origin.protocol === "https" && origin.port !== 443) {
    url += `:${origin.port}`;
  }

  return url;
}

async function getDoh(domainName: string) {
  const url = `https://cloudflare-dns.com/dns-query?name=${domainName}&type=A`;
  const response: {
    Answer: {
      data: string;
      type: number;
    }[];
  } = await fetch(url, {
    headers: {
      accept: "application/dns-json",
    },
  }).then((res) => res.json());

  return response.Answer.find((answer) => answer.type === 1)?.data;
}

export { getHostHeaderFromOrigin, getURLFromOrigin, getDoh };
