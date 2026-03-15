content = open('src/app/api/generate/download/route.js', 'r', encoding='utf-8').read()

# Remove fs/path imports and OUTPUT_DIR
content = content.replace('import path from "path";\nimport fs from "fs";\n', '')
content = content.replace('const OUTPUT_DIR = path.join(process.cwd(), "generated");\n', '')

# Remove mkdir call
content = content.replace(
    '    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });\n',
    ''
)

# Remove outputDir from all generator calls
content = content.replace('          outputDir: OUTPUT_DIR,\n', '')
content = content.replace('          outputDir: OUTPUT_DIR\n', '')
content = content.replace(', outputDir: OUTPUT_DIR', '')

# Replace file read with buffer from result
content = content.replace(
    '    const fileBuffer = fs.readFileSync(result.filePath);\n    return new NextResponse(fileBuffer, {',
    '    const fileBuffer = Buffer.isBuffer(result.buffer) ? result.buffer : Buffer.from(result.buffer);\n    return new NextResponse(fileBuffer, {'
)
content = content.replace(
    '"Content-Length": fileBuffer.length.toString(),',
    '"Content-Length": fileBuffer.length.toString(),\n        "Cache-Control": "no-store",'
)

open('src/app/api/generate/download/route.js', 'w', encoding='utf-8').write(content)
print('done')
