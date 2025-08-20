import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'vlvqauzukigsmcepdlpy.supabase.co'],
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
