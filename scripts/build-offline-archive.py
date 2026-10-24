"""Build a public portable guide with the exact Google MP3 bytes. No API key in archive."""
import json
import urllib.request
import hashlib
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
base = 'http://127.0.0.1:4173'
langs = ['vi','en','ja','ko','zh']
content = {}
audio = {}
for lang in langs:
    with urllib.request.urlopen(base + '/content-api/pois?mapId=00000000-0000-0000-0000-000000000001&lang=' + lang) as response:
        rows = json.load(response)['items']
    entries = []
    for row in rows:
        if (row.get('audio') or {}).get('provider') != 'GEMINI':
            continue
        url = row['audio']['url']
        if not url.startswith('/audio-assets/'):
            raise ValueError('Unexpected nonlocal audio URL')
        name = 'audio/' + lang + '/' + row['id'] + '.mp3'
        with urllib.request.urlopen(base + url) as response:
            data = response.read()
        if len(data) != int(row['audio']['sizeBytes']):
            raise ValueError('Incomplete audio')
        audio[name] = data
        entries.append({'name':row['name'],'text':row['scriptText'],'file':name,'voice':row['audio']['voiceName']})
    content[lang] = entries
if not audio:
    raise ValueError('No Google narration is ready. Archive not replaced.')
labels = {
 'vi':['Thuyết minh Cát Tiên ngoại tuyến','Ngôn ngữ','Chọn bài thuyết minh','Phát','Dừng','Giọng Google AI Studio đã lưu. Không cần mạng.'],
 'en':['Cat Tien offline guide','Language','Choose a narration','Play','Stop','Saved Google AI Studio voice. No network required.'],
 'ja':['カットティエン オフラインガイド','言語','解説を選択','再生','停止','保存済みGoogle AI Studio音声。ネット接続不要です。'],
 'ko':['깟띠엔 오프라인 가이드','언어','해설 선택','재생','정지','저장된 Google AI Studio 음성입니다. 인터넷이 필요 없습니다.'],
 'zh':['吉仙离线导览','语言','选择讲解','播放','停止','已保存Google AI Studio语音，无需网络。'],
}
html = '''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cat Tien offline guide</title>
<style>@font-face{font-family:Noto;src:url(NotoSans.ttf)}body{font-family:Noto,Arial,sans-serif;margin:24px auto;padding:0 20px;max-width:760px;background:#f6f7f2;color:#214b3b}select,button{font:inherit;padding:12px;max-width:100%;margin:8px 0}select{display:block;width:100%}p{line-height:1.9}audio{width:100%}</style>
<h1 id="title"></h1><label id="languageLabel" for="language"></label><select id="language"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="zh">中文</option></select><label id="stopLabel" for="stops"></label><select id="stops"></select><p id="note"></p><h2 id="name"></h2><p id="text"></p><audio id="audio" controls preload="metadata"></audio><p id="voice"></p>
<script>const content=CONTENT,labels=LABELS;const $=id=>document.getElementById(id);function select(){const row=content[$('language').value][+$('stops').value];$('audio').pause();$('name').textContent=row?.name||'';$('text').textContent=row?.text||'';$('voice').textContent=row?.voice||'';if(row)$('audio').src=row.file;else $('audio').removeAttribute('src')}function language(){const lang=$('language').value,l=labels[lang];document.documentElement.lang=lang;$('title').textContent=l[0];$('languageLabel').textContent=l[1];$('stopLabel').textContent=l[2];$('note').textContent=l[5];$('stops').replaceChildren(...content[lang].map((r,i)=>{const o=document.createElement('option');o.value=i;o.textContent=r.name;return o}));select()}$('language').onchange=language;$('stops').onchange=select;language();</script></html>'''
html = html.replace('CONTENT',json.dumps(content,ensure_ascii=False).replace('<','\\u003c')).replace('LABELS',json.dumps(labels,ensure_ascii=False).replace('<','\\u003c'))
out = root / 'web/dist/offline-guide.zip'
temp = out.with_suffix('.zip.tmp')
with ZipFile(temp,'w',ZIP_DEFLATED) as package:
    package.writestr('CatTienGuide/index.html',html)
    package.write(root/'web/vendor/fonts/NotoSans.ttf','CatTienGuide/NotoSans.ttf')
    for name,data in audio.items():package.writestr('CatTienGuide/'+name,data)
    package.writestr('CatTienGuide/manifest.json',json.dumps({'provider':'GEMINI','partial':True,'audioCount':len(audio),'languages':{lang:len(content[lang]) for lang in langs},'files':{name:{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in audio.items()}},ensure_ascii=False,indent=2))
    package.writestr('CatTienGuide/README.txt','Extract the complete folder, then open index.html in a browser. Audio MP3 files also work in a regular audio player. Keep the audio subfolders next to index.html. No password, API key or internet connection is required.\n')
temp.replace(out)
print(json.dumps({'files':len(audio),'byLanguage':{lang:len(content[lang]) for lang in langs},'bytes':out.stat().st_size}))
