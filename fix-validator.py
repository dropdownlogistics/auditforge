content = open('src/app/api/import/route.js', encoding='utf-8').read()
fixed = content.replace(
    'const VALID_FREQUENCIES    = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "AD_HOC"];',
    'const VALID_FREQUENCIES    = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "ANNUALLY", "AD_HOC"];'
)
open('src/app/api/import/route.js', 'w', encoding='utf-8').write(fixed)
print('done')
