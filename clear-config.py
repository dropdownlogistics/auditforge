content = '''/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
'''
open('next.config.js', 'w', encoding='utf-8').write(content)
print('done')
