/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [320, 420, 640, 768, 1024, 1200, 1920, 2400],
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
