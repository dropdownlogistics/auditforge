import os, glob

for f in glob.glob('src/lib/generators/*.js'):
    content = open(f, encoding='utf-8').read()
    original = content

    # ExcelJS: writeFile -> writeBuffer
    content = content.replace(
        'await workbook.xlsx.writeFile(filePath);\n  return { filePath, fileName };',
        'const buffer = await workbook.xlsx.writeBuffer();\n  return { buffer, fileName };'
    )
    # docx: doc.save(filePath) -> doc.save() as buffer
    content = content.replace(
        'await doc.save(filePath);\n  return { filePath, fileName };',
        'const buffer = Buffer.from(await doc.save());\n  return { buffer, fileName };'
    )
    # Remove path/fs requires if present
    content = content.replace("const path = require('path');\n", '')
    content = content.replace('const path = require("path");\n', '')
    content = content.replace("const fs = require('fs');\n", '')
    content = content.replace('const fs = require("fs");\n', '')
    # Remove filePath construction
    import re
    content = re.sub(r"  const fileName = [^\n]+\n  const filePath = [^\n]+\n", 
                     lambda m: m.group(0).split('\n')[0] + '\n', content)

    if content != original:
        open(f, 'w', encoding='utf-8').write(content)
        print('fixed:', f)
    else:
        print('no change:', f)
