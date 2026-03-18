content = open('src/app/app/page.js', encoding='utf-8').read()

old = '  const totalBudgetHours = audits.reduce((s, a) => s + a.team.reduce((t, m) => t + (m.budgetHours || 0), 0), 0);'
new = '  const totalBudgetHours = audits.reduce((s, a) => s + (a.team || []).reduce((t, m) => t + (m.budgetHours || 0), 0), 0);'
content = content.replace(old, new)

old2 = '  const totalControls = audits.reduce((s, a) => s + (a.controlScope?.filter(c => c.inScope).length || 0), 0);'
new2 = '  const totalControls = audits.reduce((s, a) => s + ((a.controlScope || []).filter(c => c.inScope).length || 0), 0);'
content = content.replace(old2, new2)

old3 = '  const totalTeamAssignments = audits.reduce((s, a) => s + (a.team?.length || 0), 0);'
new3 = '  const totalTeamAssignments = audits.reduce((s, a) => s + ((a.team || []).length || 0), 0);'
content = content.replace(old3, new3)

# Also fix byLead hours
old4 = '    byLead[lead].hours += a.team.reduce((t, m) => t + (m.budgetHours || 0), 0);'
new4 = '    byLead[lead].hours += (a.team || []).reduce((t, m) => t + (m.budgetHours || 0), 0);'
content = content.replace(old4, new4)

print('guards added')
open('src/app/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
