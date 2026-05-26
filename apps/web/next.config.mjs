import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Required for pnpm monorepos on Vercel: trace workspace packages
   * (@onecard/rewards-engine, @onecard/shared-types) into serverless bundles.
   */
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  transpilePackages: ["@onecard/shared-types", "@onecard/rewards-engine"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "rewardsccapibs.blob.core.windows.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
