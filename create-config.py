content = '''/** @type {import('next').NextConfig} */
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
'''
open('next.config.js', 'w', encoding='utf-8').write(content)
print('done')
