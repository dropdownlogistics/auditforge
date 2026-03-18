content = open('src/app/page.jsx', encoding='utf-8').read()

old = '      {/* Features */}'
idx = content.find('      {/* Features */}')
print('Features anchor found at:', idx)

# Find the section after features
idx2 = content.find('      <section', idx + 1)
idx3 = content.find('      <section', idx2 + 1)
print('Next two sections start at:', idx2, idx3)
print(content[idx3:idx3+100])
