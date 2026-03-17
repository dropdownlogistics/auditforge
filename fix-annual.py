content = open('batch-import.py', encoding='utf-8').read()
fixed = content.replace('"controlFrequency":"ANNUAL"', '"controlFrequency":"AD_HOC"')
open('batch-import.py', 'w', encoding='utf-8').write(fixed)
print('done:', content.count('"controlFrequency":"ANNUAL"'), 'replaced')
