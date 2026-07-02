import { execFileSync } from "node:child_process";

const applicationId =
  process.env.DOKPLOY_APPLICATION_ID || "2YxXWjXsPLgG4zvue7U75";

const requiredEnv = ["VITE_SUPABASE_URL", "VITE_SB_PUBLISHABLE_KEY"];
const optionalEnv = {
  VITE_IS_DEMO: process.env.VITE_IS_DEMO || "false",
  VITE_ATTACHMENTS_BUCKET: process.env.VITE_ATTACHMENTS_BUCKET || "attachments",
  VITE_INBOUND_EMAIL: process.env.VITE_INBOUND_EMAIL || "",
  VITE_GOOGLE_WORKPLACE_DOMAIN: process.env.VITE_GOOGLE_WORKPLACE_DOMAIN || "",
  VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION:
    process.env.VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION || "false",
};

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const publicBuildEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SB_PUBLISHABLE_KEY: process.env.VITE_SB_PUBLISHABLE_KEY,
  ...optionalEnv,
};

const serializeEnv = (values) =>
  Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

const run = (args) => {
  execFileSync("dokploy", args, { stdio: "inherit" });
};

run([
  "application",
  "save-environment",
  "--applicationId",
  applicationId,
  "--env",
  serializeEnv(publicBuildEnv),
  "--buildArgs",
  serializeEnv(publicBuildEnv),
  "--buildSecrets",
  "",
  "--createEnvFile",
  "--json",
]);

process.stdout.write(`Configured Dokploy application ${applicationId}.\n`);
