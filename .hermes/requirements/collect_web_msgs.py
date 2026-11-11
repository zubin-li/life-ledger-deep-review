#!/usr/bin/env python3
"""Every real user message for the Life Ledger WEB work, oldest first, verbatim.
Sources: Codex rollouts whose cwd is a Life Ledger repo, plus this Hermes session.
Usage: python3 collect_web_msgs.py OUT.md"""
import sqlite3, json, os, sys, glob, datetime, collections
out = sys.argv[1]
rows = []
db = sqlite3.connect(os.path.expanduser('~/.hermes/state.db'))
import datetime as _dt
for sid, since in [('20261018_064751_3af7e2', 0), ('20260927_003216_30e5f2', _dt.datetime(2026, 10, 17).timestamp())]:
    for ts, content in db.execute("select timestamp, content from messages where role='user' and session_id=? and timestamp>=? order by id", (sid, since)):
        t = (content or '').strip()
        if len(t) < 6 or t.startswith(('[CONTEXT COMPACTION', '[SYSTEM', '<', 'Review the conversation')): continue
        rows.append((datetime.datetime.fromtimestamp(float(ts)).strftime('%Y-%m-%d %H:%M'), 'hermes', t))
# Codex threads that are Life Ledger work (titles in ~/.codex/session_index.jsonl):
# 019f0da7 "添加每日习惯追踪表" = original build (06-28..), 01a0e41d = 2.0/3.x web+mac redesign (09-27..10-17).
CODEX = ['019f0da7-4a01-7090-8803-c56bcc9d034a', '01a0e41d-574d-7631-8660-6b34e3a2d751']
for p in [q for q in glob.glob(os.path.expanduser('~/.codex/sessions/2026/*/*/*.jsonl')) if any(c in q for c in CODEX)]:
    with open(p, errors='ignore') as f:
        for line in f:
            if '"role":"user"' not in line: continue
            try: o = json.loads(line)
            except Exception: continue
            pl = o.get('payload') or {}
            if pl.get('type') != 'message' or pl.get('role') != 'user': continue
            t = ' '.join((c.get('text') or '') for c in pl.get('content') or []).strip()
            if len(t) < 6 or t.startswith(('<', '# AGENTS', '[')): continue
            rows.append((o.get('timestamp', '')[:16].replace('T', ' '), 'codex:' + os.path.basename(p)[-41:-33], t))
seen, final = set(), []
for r in sorted(rows):
    k = r[2][:300]
    if k in seen: continue
    seen.add(k); final.append(r)
with open(out, 'w') as f:
    for when, src, t in final: f.write(f'## {when} [{src}]\n{t}\n\n')
print(len(final), 'messages', sum(len(r[2]) for r in final), 'chars')
print(collections.Counter((r[0][:10], r[1]) for r in final))
