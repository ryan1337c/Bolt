/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "wpaysatiyftwgaoeubjh.supabase.co",
      },
    ],
  },
};

export default nextConfig;
