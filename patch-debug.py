content = open('src/app/page.js', encoding='utf-8').read()
fixed = content.replace(
    'const toStatus = ADVANCE[ctrl.reviewStatus];',
    'const toStatus = ADVANCE[ctrl.reviewStatus]; console.log("ctrl.id:", ctrl.id, "controlId:", ctrl.controlId);'
)
open('src/app/page.js', 'w', encoding='utf-8').write(fixed)
print('done')
