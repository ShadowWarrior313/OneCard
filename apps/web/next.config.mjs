/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@onecard/shared-types", "@onecard/rewards-engine"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
