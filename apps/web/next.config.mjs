import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Stripe requires these origins for its hosted Elements / Payment Request.
const STRIPE_ORIGINS = "https://js.stripe.com https://m.stripe.com https://m.stripe.network";
const STRIPE_CONNECT = "https://api.stripe.com https://js.stripe.com https://m.stripe.network";

/** Security headers applied to every response. */
const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Block MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Minimal referrer leakage
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions policy — disable features OneCard doesn't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS — enforce HTTPS for 1 year (only sent over HTTPS, so safe for Vercel)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Content Security Policy
  // 'unsafe-inline' on style-src is required by Next.js styled-jsx & Stripe Elements.
  // 'unsafe-inline' on script-src is required by Next.js App Router hydration chunks.
  // Nonce-based CSP is the stricter alternative once the app stabilises.
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' ${STRIPE_ORIGINS}`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com`,
      `img-src 'self' data: blob: https:`,
      // Stripe Payment Element loads inside an iframe served from js.stripe.com
      `frame-src 'self' ${STRIPE_ORIGINS}`,
      // OneCard API calls + Stripe tokenisation calls from the browser
      `connect-src 'self' ${STRIPE_CONNECT} https://cdn.brandfetch.io`,
      `worker-src 'none'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
    ].join("; "),
  },
];

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

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/npm/simple-icons/**",
      },
      {
        protocol: "https",
        hostname: "www.vectorlogo.zone",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/aaronfagan/svg-credit-card-payment-icons/**",
      },
      {
        protocol: "https",
        hostname: "cdn.brandfetch.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
