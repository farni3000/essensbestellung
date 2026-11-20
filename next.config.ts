import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module and must stay outside the server bundle.
  serverExternalPackages: ["better-sqlite3"],
  // run.sh opens the app via 127.0.0.1; without this the dev server blocks
  // _next requests from that origin and React never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
