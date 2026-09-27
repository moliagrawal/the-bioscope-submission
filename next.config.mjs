/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure data/ directory is NOT served statically
  // Next.js only serves public/ by default, but be explicit
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
