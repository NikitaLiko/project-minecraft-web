import type { NextConfig } from "next";
import { cspImageOrigins } from "./lib/public-urls";

function contentSecurityPolicy(): string {
  const imgHosts = [
    "'self'",
    ...cspImageOrigins(),
    "https://mc-heads.net",
    "https://placehold.co",
    "data:",
    "blob:",
  ];
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgHosts.join(" ")}`,
    "font-src 'self' data:",
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com",
  ].join("; ");
}

const nextConfig: NextConfig = {
  output: "standalone",

  compress: false,

  images: {
    formats: ["image/avif", "image/webp"],
  },

  productionBrowserSourceMaps: false,

  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "150mb",
    },
  },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy() },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/stats/player',
        destination: '/api/minecraft/stats',
      },
      {
        source: '/stats/event',
        destination: '/api/minecraft/event',
      },
      {
        source: '/api/minecraft/event/stats/player',
        destination: '/api/minecraft/stats',
      }
    ];
  }
};

export default nextConfig;
