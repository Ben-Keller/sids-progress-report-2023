#!/usr/bin/env python3
"""Assemble index.html from template + extracted report text blocks."""
import json, re, sys, html, os

ROOT = sys.argv[1]            # site dir
BLOCKS = json.load(open(sys.argv[2]))
META = json.load(open(sys.argv[3]))

# Typo corrections applied to the extracted report text (reported to the user).
FIXES = [
    ("Throughoutut", "Throughout"),
    ("cliamte", "climate"),
    ("haev the potential", "have the potential"),
    ("mitgating", "mitigating"),
    (" olicy guidance", " Policy guidance"),
    ("entreprenurship", "entrepreneurship"),
    ("Mutidimensional", "Multidimensional"),
    ("previous imitations", "previous limitations"),
    ("Data Is a key", "Data is a key"),
    ("with young people to so they", "with young people so they"),
    ("thematic bonds1", "thematic bonds"),
    ("as shown in Figure 13", "as shown in Figure 8"),
    ("technical assistance, and capacity-", "technical assistance, and capacity-building."),
    ("Portuguese.The course", "Portuguese. The course"),
    ("middle-or high-income", "middle- or high-income"),
    ("safe-guarded", "safeguarded"),
    ("'", "’"),
]

def raw(tok):
    parts = []
    for t in tok.split('+'):
        p, i = t.split(':')
        if '-' in i:
            a, b = i.split('-')
            idx = range(int(a), int(b) + 1)
        else:
            idx = [int(i)]
        for k in idx:
            parts.append(BLOCKS[p][k]['t'].strip())
    s = ' '.join(parts)
    s = re.sub(r'\s+', ' ', s)
    for a, b in FIXES:
        s = s.replace(a, b)
    # opening single quotes after space/open paren
    s = re.sub(r'(^|[\s(])’(?=\w)', lambda m: m.group(1) + '‘', s)
    s = s.replace('— and', ' — and').replace('  ', ' ')
    return s

def esc(s):
    return html.escape(s, quote=False)

CREDITS = {}

def m_P(arg):
    return '\n'.join(f'<p class="rv">{esc(raw(t))}</p>' for t in arg.split())

def m_T(arg):
    return esc(raw(arg.strip()))

def m_REC(arg):
    parts = [x.strip() for x in arg.split('|')]
    a, b = parts[0], parts[1]
    head = re.sub(r'^\d+\.\s*', '', raw(a))
    if not head.endswith('.'):
        head += '.'
    fig = ''
    if len(parts) > 2:
        name, alt = parts[2], parts[3]
        credit = parts[4] if len(parts) > 4 else ''
        fig = ('<figure class="rec-fig">' + m_IMG(f'{name}|{alt}||{credit}')
               + (m_CREDIT(credit) if credit else '') + '</figure>')
    return (f'<li class="rec rv"><div class="rec-txt"><h4>{esc(head)}</h4><p>{esc(raw(b))}</p></div>{fig}</li>')

def m_STAT(arg):
    v, num, cap = [x.strip() for x in arg.split('|', 2)]
    count = f' data-count="{num[:-1]}"' if num.endswith('%') and num[:-1].isdigit() else ''
    numhtml = (f'<span class="num"{count}>{num[:-1]}</span><span class="pct">%</span>'
               if num.endswith('%') else f'<span class="num word">{esc(num)}</span>')
    return (f'<figure class="stat rv" style="--v:{v}">'
            f'<svg class="pie" viewBox="0 0 64 64" aria-hidden="true"><circle class="pie-bg" cx="32" cy="32" r="32"/>'
            f'<circle class="pie-fg" cx="32" cy="32" r="16"/></svg>'
            f'<figcaption><span class="big">{numhtml}</span><span class="cap">{cap}</span></figcaption></figure>')

def m_IMG(arg):
    parts = [x.strip() for x in arg.split('|')]
    name, alt = parts[0], parts[1]
    cls = parts[2] if len(parts) > 2 else ''
    credit = parts[3] if len(parts) > 3 else ''
    w, h = META[name]
    if credit:
        CREDITS[name] = (alt, credit)
    eager = 'eager' in cls
    cls = cls.replace('eager', '').strip()
    load = '' if eager else ' loading="lazy"'
    return (f'<img src="assets/{name}.webp" width="{w}" height="{h}" alt="{html.escape(alt)}"'
            f'{load} decoding="async"' + (f' class="{cls}"' if cls else '') + '>')

def m_CREDIT(arg):
    return f'<span class="credit">Photo: {esc(arg.strip())}</span>'

MACROS = {'P': m_P, 'T': m_T, 'REC': m_REC, 'STAT': m_STAT, 'IMG': m_IMG, 'CREDIT': m_CREDIT}

def expand(tpl):
    def sub(m):
        return MACROS[m.group(1)](m.group(2))
    return re.sub(r'\[\[(P|T|REC|STAT|IMG|CREDIT)\s+(.*?)\]\]', sub, tpl, flags=re.S)

src = os.path.join(ROOT, 'src')
tpl = open(os.path.join(src, 'template.html')).read()
body = expand(tpl)
css = open(os.path.join(src, 'style.css')).read()
js = open(os.path.join(src, 'app.js')).read()
SHORT = dict(hero='Boat on open ocean', male='Mal\u00e9, Maldives', island='Island', harbour='Harbour', turbines='Wind turbines',
    satcoast='Atoll from space', mangrove='Mangrove planting', rubble='After the storm', celebrate='Celebration', coral='Coral reef', coralc='Coral reef', windsunset='Turbines at dusk',
    turtle='Sea turtle', fishfarm='Fish farms', solar='Floating solar', tuna='Digital tuna', atollstrip='Atoll', atolls='Atolls from space',
    beachaerial='Forest and beach', vfarm='Vertical farm', catch='Tuna catch', nasa='Coast from space', ship='Container ship',
    vr='Virtual reef', buoys='Canoe and buoys', mangrovesat='Mangrove channels', windisland='Island wind and solar',
    circuit='Island and circuits', dusk='Turbines at dusk', whales='Whales', swim='Swimmer', beach='Beach')
seen, items = set(), []
for n, (a, c) in CREDITS.items():
    key = (SHORT.get(n, a), c)
    if key not in seen:
        seen.add(key); items.append(key)
cred = ''.join(f'<li><span>{esc(l)}</span> {esc(c)}</li>' for l, c in items)
body = body.replace('<!--CREDITS-->', cred)
out = body.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
left = re.findall(r'\[\[[A-Z]+ [^\]]*\]\]', out)
if left:
    print('UNEXPANDED:', left[:5])
open(os.path.join(ROOT, 'index.html'), 'w').write(out)
print('index.html', len(out) // 1024, 'KB; words ~', len(re.sub(r'<[^>]+>', ' ', body).split()))
