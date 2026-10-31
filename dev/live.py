# Refresh plugin 520374 on TRMNL, read its merge variables, and pull preview renders of every size.
# Usage: python3 dev/live.py [refresh] [shots]
import json, sys, time, base64, urllib.request, re, os
KEY = re.search(r'api_key:\s*(\S+)', open(os.path.expanduser('~/.config/trmnlp/config.yml')).read()).group(1)
PID = 520374; B = f'https://trmnl.com/api/plugin_settings/{PID}'
def call(method, path, body=None):
    req = urllib.request.Request(B + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'trmnlp/0.7.1 loot-drop-dev'})
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e: return {'http_error': e.code, 'body': e.read().decode()[:400]}
def wait(path):
    for _ in range(40):
        r = call('GET', path); s = (r.get('data') or {}).get('status')
        if s not in ('pending', 'queued', 'running'): return r
        time.sleep(3)
    return r
if 'refresh' in sys.argv:
    r = call('POST', '/refreshes', {}); print('refresh', r)
    jid = (r.get('data') or {}).get('job_id')
    if jid: print('refresh result', json.dumps(wait(f'/refreshes/{jid}'))[:600])
mv = call('GET', '/merge_variables'); json.dump(mv, open('dev/live/merge_variables.json', 'w'), indent=1)
loot = (mv.get('data') or mv).get('loot') if isinstance(mv.get('data') or mv, dict) else None
print('merge vars keys', list((mv.get('data') or mv).keys())[:10] if isinstance(mv.get('data') or mv, dict) else mv)
if 'shots' in sys.argv:
    for size in ['markup_full', 'markup_half_horizontal', 'markup_half_vertical', 'markup_quadrant']:
        for dev in ['og_plus', 'v2']:
            r = call('POST', '/screenshots', {'size': size, 'device_model': dev}); jid = (r.get('data') or {}).get('job_id')
            if not jid: print(size, dev, r); continue
            res = wait(f'/screenshots/{jid}'); b64 = (res.get('data') or {}).get('preview_base64')
            if b64: open(f'dev/live/{size}_{dev}.png', 'wb').write(base64.b64decode(b64)); print('shot', size, dev)
            else: print(size, dev, json.dumps(res)[:300])
