import * as z from "zod";

type DevhostServerResponse = {
  status: "error" | "success";
  message?: string;
};

type DevhostServerError = {
  message: string;
  command?: string;
};

const protocolSchema = z.enum(["http", "https"]);
type Protocol = z.infer<typeof protocolSchema>;

const headerReplaceSchema = z.object({
  name: z.string(),
  pattern: z.string(),
  replacement: z.string(),
  flags: z.string().optional(),
});
type HeaderReplace = z.infer<typeof headerReplaceSchema>;

const headerReplacesSchema = z.array(headerReplaceSchema);
type HeaderReplaces = z.infer<typeof headerReplacesSchema>;

const originSchema = z.object({
  protocol: protocolSchema,
  host: z.string().nonempty().max(255),
  port: z.number(),
});
type Origin = z.infer<typeof originSchema>;

const targetSchema = z.object({
  id: z.number(),
  name: z.string(),
  origin: originSchema,
  useDefaultHeaderReplacements: z.boolean(),
  headerReplaces: headerReplacesSchema,
});
type Target = z.infer<typeof targetSchema>;

const targetsSchema = z.array(targetSchema);
type Targets = z.infer<typeof targetsSchema>;

const proxySchema = z.object({
  id: z.number(),
  name: z.string(),
  enabled: z.boolean(),
  enabledSchemaId: z.number().optional(),
  origin: originSchema,
  targets: targetsSchema,
});
type Proxy = z.infer<typeof proxySchema>;

const proxiesSchema = z.array(proxySchema);

export type {
  DevhostServerResponse,
  DevhostServerError,
  Protocol,
  HeaderReplace,
  HeaderReplaces,
  Origin,
  Target,
  Targets,
  Proxy,
};
export { proxiesSchema };
