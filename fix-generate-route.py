content = open('src/app/api/generate/route.js', 'r', encoding='utf-8').read()

# Remove fs/path imports and OUTPUT_DIR
content = content.replace('import path from "path";\nimport fs from "fs";\n', '')
content = content.replace('const OUTPUT_DIR = path.join(process.cwd(), "generated");\n', '')

# Remove mkdir call
content = content.replace(
    '    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });\n',
    ''
)

# Remove outputDir from all generator calls
content = content.replace(
    'controls: controlData, outputDir: OUTPUT_DIR })',
    'controls: controlData })'
)
content = content.replace(
    'controls: processControls, risks,\n          preparedBy: options.preparedBy || "AuditForge", outputDir: OUTPUT_DIR,',
    'controls: processControls, risks,\n          preparedBy: options.preparedBy || "AuditForge",'
)

# Fix filePath reference in prisma create (buffer has no filePath)
content = content.replace(
    '        filePath: result.filePath,',
    '        filePath: result.fileName,'
)

open('src/app/api/generate/route.js', 'w', encoding='utf-8').write(content)
print('done')
