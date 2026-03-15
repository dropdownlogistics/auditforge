import glob, re

for f in glob.glob('src/lib/generators/*.js'):
    content = open(f, encoding='utf-8').read()
    original = content

    # Fix logoPath - just remove it, logo embedding can be skipped on Vercel
    content = re.sub(r'.*const logoPath = path\.join.*\n', '', content)
    content = re.sub(r'.*logoPath.*\n', '', content)

    # Fix walkthrough writeFileSync
    content = content.replace(
        'fs.writeFileSync(filePath, buffer);\n  return { filePath, fileName };',
        'return { buffer, fileName };'
    )

    # Remove any remaining path/fs requires
    content = content.replace("const path = require('path');\n", '')
    content = content.replace('const path = require("path");\n', '')
    content = content.replace("const fs = require('fs');\n", '')
    content = content.replace('const fs = require("fs");\n', '')
    content = content.replace("import path from 'path';\n", '')
    content = content.replace('import path from "path";\n', '')
    content = content.replace("import fs from 'fs';\n", '')
    content = content.replace('import fs from "fs";\n', '')

    if content != original:
        open(f, 'w', encoding='utf-8').write(content)
        print('fixed:', f)
    else:
        print('no change:', f)
