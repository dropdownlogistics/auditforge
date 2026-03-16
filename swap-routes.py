import os, shutil

# 1. Create /app directory
os.makedirs('src/app/app', exist_ok=True)

# 2. Move SPA (page.js) to /app/page.js
shutil.copy('src/app/page.js', 'src/app/app/page.js')

# 3. Copy landing to root page.jsx
shutil.copy('src/app/landing/page.jsx', 'src/app/page.jsx')

print('files moved')
