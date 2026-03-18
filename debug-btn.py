content = open('src/app/app/page.js', encoding='utf-8').read()
idx = content.find('+ New Audit')
# Find the surrounding action block
chunk = content[idx-200:idx+100]
print(repr(chunk))
