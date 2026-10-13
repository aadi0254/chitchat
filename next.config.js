/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Disabling SWC minifier to bypass potential Node v24 compatibility issues
};

module.exports = nextConfig;