content = open('src/app/page.js', 'r', encoding='utf-8').read()

old = '''  const [view, setView] = useState("dashboard");
  const { open: searchOpen, setOpen: setSearchOpen, query: searchQuery, setQuery: setSearchQuery } = useGlobalSearch(controls, risks, processes);
  const [controls, setControls] = useState([]);
  const [risks, setRisks] = useState([]);
  const [processes, setProcesses] = useState([]);'''

new = '''  const [view, setView] = useState("dashboard");
  const [controls, setControls] = useState([]);
  const [risks, setRisks] = useState([]);
  const [processes, setProcesses] = useState([]);
  const { open: searchOpen, setOpen: setSearchOpen, query: searchQuery, setQuery: setSearchQuery } = useGlobalSearch(controls, risks, processes);'''

content = content.replace(old, new, 1)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done:', content.count('useGlobalSearch') > 0)
