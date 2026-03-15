import os

files = [
    'src/lib/generators/rcm-generator.js',
    'src/lib/generators/mcl-generator.js',
    'src/lib/generators/walkthrough-generator.js',
]

for f in files:
    if not os.path.exists(f):
        print(f'skipping {f} - not found')
        continue
    content = open(f, encoding='utf-8').read()
    # Replace writeFile with writeBuffer
    content = content.replace(
        'await workbook.xlsx.writeFile(filePath);\n  return { filePath, fileName };',
        'const buffer = await workbook.xlsx.writeBuffer();\n  return { buffer, fileName };'
    )
    # docx generators use a different pattern
    content = content.replace(
        'await doc.save(filePath);\n  return { filePath, fileName };',
        'const buffer = Buffer.from(await doc.save());\n  return { buffer, fileName };'
    )
    open(f, 'w', encoding='utf-8').write(content)
    print(f'fixed: {f}')
