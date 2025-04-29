import { encrypt } from "#lib/crypto";
import type { Proxy } from "#lib/schemas";

const data: Proxy[] = [
  {
    id: 0,
    name: "test",
    origin: {
      protocol: "https",
      host: "www.example.com",
      port: 8443,
    },
    enabled: true,
    enabledSchemaId: 789,
    targets: [
      {
        id: 123,
        name: "next",
        origin: {
          protocol: "http",
          host: "localhost",
          port: 3000,
        },
        useDefaultHeaderReplacements: true,
        headerReplaces: [
          {
            name: "host",
            pattern: "/^.+$/",
            replacement: "localhost:3000",
          },
          {
            name: "origin",
            pattern: "/^.+$/",
            replacement: "localhost:3000",
          },
        ],
      },
      {
        id: 456,
        name: "production",
        origin: {
          protocol: "https",
          host: "www.example.com",
          port: 443,
        },
        useDefaultHeaderReplacements: true,
        headerReplaces: [
          {
            name: "host",
            pattern: "^.+$",
            replacement: "www.example.com",
          },
          {
            name: "origin",
            pattern: "^.+$",
            replacement: "https://www.example.com",
          },
        ],
      },
      {
        id: 789,
        name: "google",
        origin: {
          protocol: "https",
          host: "www.google.com",
          port: 443,
        },
        useDefaultHeaderReplacements: true,
        headerReplaces: [
          {
            name: "host",
            pattern: "^.+$",
            replacement: "www.google.com",
          },
          {
            name: "origin",
            pattern: "^.+$",
            replacement: "https://www.google.com",
          },
        ],
      },
    ],
  },
];

console.log(
  await fetch("https://localhost:24601", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: await encrypt(JSON.stringify(data), "localhost"),
  }).then((res) => res.json())
);
