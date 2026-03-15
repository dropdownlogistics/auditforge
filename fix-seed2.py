lines = open('scripts/seed-auditors.js', 'r', encoding='utf-8').readlines()
lines[-1] = "main().catch(console.error).finally(() => prisma['']())\n"
open('scripts/seed-auditors.js', 'w', encoding='utf-8').write(''.join(lines))
print('last line:', lines[-1].strip())
