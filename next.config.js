/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/landing',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
