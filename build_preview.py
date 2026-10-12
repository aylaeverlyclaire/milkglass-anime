import os

base_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(base_dir, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()
with open(os.path.join(base_dir, 'app.js'), 'r', encoding='utf-8') as f:
    js = f.read()

inlined = html.replace('<script src="app.js"></script>', '<script>\n' + js + '\n</script>')

# Output to root repository preview
local_preview = os.path.join(base_dir, 'milkglass_preview.html')
with open(local_preview, 'w', encoding='utf-8') as f:
    f.write(inlined)

# Also output to active brain artifact directory if present
artifact_dir = r'C:\Users\mrido\.gemini\antigravity\brain\b46e5285-6aa8-4b30-8e71-4534a6a89d8d'
if os.path.exists(artifact_dir):
    with open(os.path.join(artifact_dir, 'milkglass_preview.html'), 'w', encoding='utf-8') as f:
        f.write(inlined)

print('Preview generated successfully, size:', len(inlined))
