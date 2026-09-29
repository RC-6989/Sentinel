type DashboardEnvironment = {
  NODE_ENV?: string;
  SENTINEL_WAITLIST_MODE?: string;
  SENTINEL_DATA_DIR?: string;
  SENTINEL_PERSISTENT_STORAGE_CONFIRMED?: string;
  AUTH_SECRET?: string;
};

export function configuredAuthSecret(secret: string | undefined): boolean {
  return Boolean(secret && secret.length >= 32 && !secret.startsWith("local-dev-only-"));
}

/** Keep account routes closed on ephemeral or incompletely configured production hosts. */
export function dashboardEnabled(env: DashboardEnvironment = process.env): boolean {
  if (env.SENTINEL_WAITLIST_MODE === "true") return false;
  if (env.NODE_ENV !== "production") return true;

  const dataDir = env.SENTINEL_DATA_DIR?.trim() ?? "";
  const absoluteDataDir = dataDir.startsWith("/") || /^[A-Za-z]:[\\/]/.test(dataDir);
  return env.SENTINEL_WAITLIST_MODE === "false" &&
    absoluteDataDir &&
    env.SENTINEL_PERSISTENT_STORAGE_CONFIRMED === "true" &&
    configuredAuthSecret(env.AUTH_SECRET);
}
