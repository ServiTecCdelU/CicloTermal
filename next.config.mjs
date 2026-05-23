/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs"],
  },
}

export default nextConfig
