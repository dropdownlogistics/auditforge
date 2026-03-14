content = open('src/app/page.js', 'r', encoding='utf-8').read()
content = content.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect, useRef, useCallback } from "react";'
)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
