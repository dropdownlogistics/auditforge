import re, glob

for f in glob.glob('src/lib/generators/*.js'):
    content = open(f, encoding='utf-8').read()
    original = content

    # Remove the broken logo block - addImage call and orphaned closing brace
    content = re.sub(r'\s*// DDL Logo\n.*?cover\.addImage.*?\n\s*\}\n', '\n', content, flags=re.DOTALL)
    content = re.sub(r'\s*// Logo\n.*?\.addImage.*?\n\s*\}\n', '\n', content, flags=re.DOTALL)

    # Also catch any remaining addImage lines
    content = re.sub(r'.*addImage.*\n', '', content)
    content = re.sub(r'.*workbook\.addImage.*\n', '', content)
    content = re.sub(r'.*const img =.*\n', '', content)

    # Remove orphaned closing braces that follow an empty line + comment
    # by checking for } on its own line after the logo removal
    if content != original:
        open(f, 'w', encoding='utf-8').write(content)
        print('fixed:', f)
    else:
        print('no change:', f)
