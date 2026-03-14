content = open('src/app/page.js', 'r', encoding='utf-8').read()

# Add lucide import after the first line
old_import = '"use client";'
new_import = '"use client";\n\nimport { LayoutDashboard, BarChart2, Shield, AlertTriangle, Network, BookOpen, FileOutput, Upload } from "lucide-react";'
content = content.replace(old_import, new_import, 1)

# Replace NAV array with lucide components
old_nav = '''  const NAV = [
    { id: "dashboard", icon: "◉", label: "Dashboard" },
    { id: "analytics", icon: "◈", label: "Analytics" },
    { id: "controls", icon: "⬡", label: "Controls" },
    { id: "risks", icon: "△", label: "Risks" },
    { id: "processes", icon: "◫", label: "Processes" },
    { id: "audits", icon: "◈", label: "Audits" },
    { id: "generate", icon: "⬢", label: "Generate" },
    { id: "import", icon: "⬆", label: "Import" },
  ];'''

new_nav = '''  const NAV = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "controls", icon: Shield, label: "Controls" },
    { id: "risks", icon: AlertTriangle, label: "Risks" },
    { id: "processes", icon: Network, label: "Processes" },
    { id: "audits", icon: BookOpen, label: "Audits" },
    { id: "generate", icon: FileOutput, label: "Generate" },
    { id: "import", icon: Upload, label: "Import" },
  ];'''

content = content.replace(old_nav, new_nav, 1)

# Replace icon rendering in the nav map
old_render = '<span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>'
new_render = '<n.icon size={16} style={{ minWidth: 16 }} />'
content = content.replace(old_render, new_render, 1)

open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done:', 'lucide-react' in content)
