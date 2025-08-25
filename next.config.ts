import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vlvqauzukigsmcepdlpy.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'deoophjehfjbmwndsvtl.supabase.co',
      },
    ],
  },
  /* config options here */
  redirects: async () => [
    {
      source: "/",
      destination: "/signup",
      permanent: true,
    },
  ],
};

export default nextConfig;
