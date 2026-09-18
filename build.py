import io, os, re
root = os.path.dirname(os.path.abspath(__file__))
shell = io.open(os.path.join(root,'build','shell.html'), encoding='utf-8').read()
# 去掉写错的空嵌套块
shell = shell.replace(':root:not([data-theme="light"]){\n  @media (prefers-color-scheme: dark){}\n}\n', '')
parts = [shell]
for f in ['rng.js','content.js','tracks_a.js','tracks_b.js','tracks_c.js','jobtracks.js','jobevents_a.js','jobevents_b.js','jobevents_c.js','events2.js','engine.js','ui.js']:
    src = io.open(os.path.join(root,'js',f), encoding='utf-8').read()
    parts.append('\n<script>\n/* ===== %s ===== */\n%s\n</script>\n' % (f, src))
out = ''.join(parts)
p = os.path.join(root,'build','reallife-demo.html')
io.open(p,'w',encoding='utf-8').write(out)
print('bytes', len(out.encode('utf-8')))
print('stray nested block removed:', '@media (prefers-color-scheme: dark){}' not in out)
print('scripts inlined:', out.count('<script>'))
