import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  // Avoid picking up lockfiles outside this monorepo (e.g. home directory).
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
