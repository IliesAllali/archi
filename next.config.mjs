/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Exclude @react-pdf/renderer from server bundle — browser-only APIs
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
