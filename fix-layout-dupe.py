content = open('src/app/layout.js', 'r', encoding='utf-8').read()
lines = content.split('\n')
seen = False
out = []
for line in lines:
    if 'import { ClerkProvider } from "@clerk/nextjs"' in line:
        if not seen:
            out.append(line)
            seen = True
    else:
        out.append(line)
open('src/app/layout.js', 'w', encoding='utf-8').write('\n'.join(out))
print('done')
