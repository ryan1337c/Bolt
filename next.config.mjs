/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "oaidalleapiprodscus.blob.core.windows.net",
      "https://wpaysatiyftwgaoeubjh.supabase.co",
    ],
  },
};

export default nextConfig;

// remotePatterns: [
//         {
//           protocol: 'https',
//           hostname: '**.supabase.co', // Or your specific Supabase project URL
//           pathname: '/storage/v1/object/public/**',
//         },
//       ],
