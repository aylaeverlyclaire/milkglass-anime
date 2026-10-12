with open(r'C:\Users\mrido\.gemini\antigravity\scratch\milkglass-anime\index.html', 'r', encoding='utf-8') as f:
    html = f.read()
with open(r'C:\Users\mrido\.gemini\antigravity\scratch\milkglass-anime\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

inlined = html.replace('<script src="app.js"></script>', '<script>\n' + js + '\n</script>')

import os

target = r'C:\Users\mrido\.gemini\antigravity\brain\efc17572-2d12-48d2-94ba-c0c225b57d17\milkglass_preview.html'
os.makedirs(os.path.dirname(target), exist_ok=True)
with open(target, 'w', encoding='utf-8') as f:
    f.write(inlined)
print('Preview generated successfully, size:', len(inlined))
