content = open('src/app/import/page.jsx', 'r', encoding='utf-8').read()

# Find second occurrence of TEMPLATES and remove from there to downloadTemplate closing brace
marker = 'const TEMPLATES = {'
first = content.index(marker)
second = content.index(marker, first + 1)

# Find end of the downloadTemplate function after second occurrence
end_marker = 'URL.revokeObjectURL(url);\n}\n'
end_pos = content.index(end_marker, second) + len(end_marker)

content = content[:second] + content[end_pos:]
open('src/app/import/page.jsx', 'w', encoding='utf-8').write(content)
print('done:', content.count('const TEMPLATES') == 1)
