/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.API_ORIGIN || "http://127.0.0.1:4000").replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  /**
   * Browser calls /api/* on the same host (3000); Next forwards to Express (4000).
   * Set API_ORIGIN when the API runs elsewhere (Docker, another machine).
   * If you set NEXT_PUBLIC_API_BASE in the browser, lib/api.js skips the proxy and calls the API directly (enable CORS on the API).
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
