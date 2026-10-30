import { LANGS, LOCALES, localize, routeTo, haversine, qrValue, validatePoi, normalizeSearch, matchesPoiQuery } from './core.mjs';
import { settings, saveSettings, token, loadSeed, getPois, getAdminPois, savePoi, deletePoi, saveOffline, api, packKey } from './store.mjs';
import { VisitorAnalytics, playbackCounter, getAnalytics } from './analytics.mjs';
import { joinURL, isLoopback, qrSVG } from './join-qr.mjs';
import { setupAdminTools } from './admin-tools.mjs';
import { runtimeConfig, loadRuntimeConfig, sharePosition } from './visitor-config.mjs';
import { createOutdoorMap, documentCoordinates } from './outdoor-map.mjs';
import { loadVoices, selectVoice, playbackSource } from './browser-tts.mjs';
import {stopNumber,renderSchematic} from './schematic-map.mjs';
import {installUITranslations,translateUI,formatUI} from './ui-i18n.mjs';

const requestedSource = new URL(location.href).searchParams.get('source');
if (['demo', 'api'].includes(requestedSource)) saveSettings(requestedSource);

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const group = id => copy[state.lang][{ 1: 'facility', 2: 'tree', 3: 'water' }[id] || 'all'].replace(/^[♧≈⌂] /, '');
const copy = {
  vi: { play: '▶ Nghe thuyết minh', stop: '■ Dừng phát', auto: 'Tự phát theo GPS', route: 'Tìm đường', center: 'Trung tâm Du khách', search: 'Tìm điểm đến theo tên, mã hoặc nội dung…', clearSearch: 'Xóa nội dung tìm kiếm', empty: 'Không có điểm phù hợp.', choose: 'Chọn một điểm trên sơ đồ để khám phá câu chuyện.', all: 'Tất cả', tree: '♧ Cây & rừng', water: '≈ Nước & thác', facility: '⌂ Khu chức năng', from: 'Đi từ', distance: 'km · khoảng', minute: 'phút đi bộ', verified: 'GPS đã xác thực', schematic: 'Vị trí trên sơ đồ', share: 'Sao chép liên kết', point: 'điểm dừng', narration: 'Lời thuyết minh', map: 'Chỉ tuyến trên sơ đồ, khoảng cách ước lượng.', noRoute: 'Điểm này chưa có trong đồ thị đường đi.', autoHint: 'Tự phát chỉ áp dụng cho điểm có GPS đã xác thực.' },
  en: { play: '▶ Play audio guide', stop: '■ Stop playback', auto: 'GPS autoplay', route: 'Find route', center: 'Visitor Center', search: 'Search by name, code, or story…', clearSearch: 'Clear search', empty: 'No matching stops.', choose: 'Choose a stop on the map to discover its story.', all: 'All stops', tree: '♧ Trees & forest', water: '≈ Water & rapids', facility: '⌂ Facilities', from: 'Start from', distance: 'km · about', minute: 'min walking', verified: 'Verified GPS', schematic: 'Schematic location', share: 'Copy link', point: 'stops', narration: 'Audio guide', map: 'Schematic route; distances are approximate.', noRoute: 'This stop has no mapped route yet.', autoHint: 'Autoplay is available only for stops with verified GPS.' },
  ja: { play: '▶ 音声ガイド', stop: '■ 停止', auto: 'GPS自動再生', route: 'ルート検索', center: 'ビジターセンター', search: '名前・番号・案内文で検索…', clearSearch: '検索をクリア', empty: '該当するスポットがありません。', choose: '地図からスポットを選んでください。', all: 'すべて', tree: '♧ 樹木・森', water: '≈ 水辺・急流', facility: '⌂ 施設', from: '出発点', distance: 'km · 約', minute: '分（徒歩）', verified: 'GPS確認済み', schematic: '概略位置', share: 'リンクをコピー', point: 'スポット', narration: '音声ガイド', map: '概略ルートと推定距離です。', noRoute: 'このスポットのルートは未登録です。', autoHint: 'GPS確認済みのスポットでのみ自動再生します。' },
  ko: { play: '▶ 음성 안내', stop: '■ 정지', auto: 'GPS 자동 재생', route: '경로 찾기', center: '방문자 센터', search: '이름·코드·안내 내용 검색…', clearSearch: '검색 지우기', empty: '검색 결과가 없습니다.', choose: '지도에서 방문지를 선택하세요.', all: '전체', tree: '♧ 나무 / 숲', water: '≈ 물 / 급류', facility: '⌂ 시설', from: '출발지', distance: 'km · 약', minute: '분 도보', verified: 'GPS 확인됨', schematic: '개략적 위치', share: '링크 복사', point: '개 지점', narration: '음성 안내', map: '개략 경로이며 거리는 추정치입니다.', noRoute: '이 지점의 경로가 등록되지 않았습니다.', autoHint: '확인된 GPS 지점에서만 자동 재생됩니다.' },
  zh: { play: '▶ 播放讲解', stop: '■ 停止', auto: 'GPS自动播放', route: '查找路线', center: '游客中心', search: '按名称、编号或讲解内容搜索…', clearSearch: '清除搜索', empty: '没有符合条件的景点。', choose: '在地图上选择景点，聆听故事。', all: '全部', tree: '♧ 树木 / 森林', water: '≈ 水域 / 急流', facility: '⌂ 设施', from: '出发点', distance: 'km · 约', minute: '分钟步行', verified: 'GPS已验证', schematic: '示意图位置', share: '复制链接', point: '个景点', narration: '语音导览', map: '示意路线，距离为估算。', noRoute: '此景点暂无路线数据。', autoHint: '仅在GPS已验证的景点自动播放。' },
};
const state = { lang: localStorage.getItem('sag:lang') || 'vi', pois: [], searchIndex: new Map(), selected: null, category: 0, query: '', route: null, from: '0', source: '', admin: [], editing: null, isNew: false, tab: 'visitor', playing: false, auto: false, gps: null, hits: new Map(), cooldown: new Map() };
if (!LANGS[state.lang]) state.lang = 'vi';
let seed, audio, watchId = null, refreshId = 0, adminRefreshId = 0, toastTimer, cameraStream, scanFrame, zoom = 1;
let analyticsData = null, analyticsRun = 0, joinBlobUrl, joinLink = '', defaultJoinUrl = new URL('./', location.href).href;
let audioRun = 0, outdoorVisible = false;
let voiceMode = ['mp3','browser'].includes(localStorage.getItem('sag:voice-mode-v2')) ? localStorage.getItem('sag:voice-mode-v2') : 'auto';
const languageSwitcher = $('#language-switcher');
const refreshUITranslations = installUITranslations(() => state.lang);
const outdoorMap = createOutdoorMap({ container: $('#outdoor-map'), note: $('#outdoor-note'), onSelect: id => selectPoi(id) });
function updateOutdoor() { outdoorMap.update({ pois: filtered(), selectedId: state.selected, gps: state.gps }); }
const usage = new VisitorAnalytics();
const counter = playbackCounter((poi, mode) => { try { usage.record(poi, mode); } catch { toast('Không lưu được lượt nghe. Bộ nhớ trình duyệt có thể đã đầy.', true); } });
const t = key => copy[state.lang][key];
function toast(message, error = false) { $('#toast').textContent = message; $('#toast').classList.toggle('error', error); $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 6500); }
function filtered() {
  const query = state.query.trim();
  const numericQuery = /^\d+$/.test(query) ? Number(query) : null;
  const candidates = state.pois.filter(p => !state.category || p.categoryId === state.category);
  if (numericQuery !== null) return candidates.filter(p => Number(stopNumber(p)) === numericQuery);
  if (!query) return candidates;
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const nameMatches = candidates.filter(p => [p.code, p.name, ...(p.translations || []).map(t => t.name)]
    .filter(Boolean).map(normalizeSearch).some(name => tokens.every(token => name.includes(token))));
  if (nameMatches.length) return nameMatches;
  return candidates.filter(p => matchesPoiQuery(p, query, state.searchIndex.get(p.id) || []));
}
function makeSearchIndex(items) {
  const index = new Map();
  for (const poi of items) {
    const fields = [poi.code, poi.name, poi.summary, poi.scriptText].filter(Boolean);
    index.set(poi.id, [...(index.get(poi.id) || []), ...fields]);
  }
  return index;
}
async function refreshSearchIndex(run, source, currentItems) {
  const items = [...currentItems];
  if (source === 'api') {
    const otherLanguages = Object.keys(LANGS).filter(lang => lang !== state.lang);
    const results = await Promise.allSettled(otherLanguages.map(lang => getPois(lang)));
    for (const result of results) if (result.status === 'fulfilled') items.push(...result.value.items);
  } else if (source === 'offline') {
    for (const lang of Object.keys(LANGS)) {
      try {
        const pack = localStorage.getItem(packKey(lang));
        if (pack) items.push(...JSON.parse(pack).items);
      } catch { /* Skip an unreadable language pack; current language remains searchable. */ }
    }
  }
  if (run !== refreshId) return;
  state.searchIndex = makeSearchIndex(items);
  renderMap(); renderList();
}
function selected() { return state.pois.find(p => p.id === state.selected); }
function routeNode(poi) { return Number(poi?.sortOrder) === 1 ? '0' : String(poi?.code ?? ''); }
function safeURL(url) { try { const u = new URL(url, location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
function updateLanguage() {
  document.documentElement.lang = state.lang;
  languageSwitcher.querySelectorAll('[data-lang]').forEach(button => {
    const active = button.dataset.lang === state.lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#search').placeholder = t('search');
  $('#search').setAttribute('aria-label', t('search'));
  $('#search-clear').setAttribute('aria-label', t('clearSearch'));
  $('#search-clear').title = t('clearSearch');
  $('#search-clear').hidden = !state.query;
  const keys = ['all', 'tree', 'water', 'facility'];
  $$('#filters button').forEach((b, i) => b.textContent = t(keys[i]));
  refreshUITranslations();
}
async function refresh() {
  const run = ++refreshId;
  $('#data-note').textContent = 'Đang tải dữ liệu…';
  try {
    await loadRuntimeConfig();
    const result = await getPois(state.lang);
    if (run !== refreshId) return;
    state.pois = result.items.sort((a, b) => (a.sortOrder??0)-(b.sortOrder??0)||a.code.localeCompare(b.code, undefined, { numeric: true }));
    state.source = result.source;
    if (!selected()) state.selected = state.pois.find(p => p.code === new URL(location.href).searchParams.get('poi'))?.id || state.pois.find(p => p.code === '9')?.id || state.pois[0]?.id;
    state.route = null;
    $('#data-note').textContent = state.source === 'demo' ? 'DEMO CỤC BỘ · Dữ liệu mẫu; thay đổi quản trị được lưu trong trình duyệt này.' : state.source === 'offline' ? 'NGOẠI TUYẾN · Đang dùng gói đã lưu. API hiện không truy cập được.' : 'BACKEND TRỰC TIẾP · Nội dung được tải từ API NestJS.';
    $('#connection').textContent = { demo: 'Demo cục bộ', api: 'Backend trực tiếp', offline: 'Gói ngoại tuyến' }[state.source];
  } catch (error) {
    if (run !== refreshId) return;
    state.pois = []; state.selected = null; state.source = 'error';
    $('#data-note').textContent = `${error.message} Mở Kết nối để kiểm tra chế độ hoặc chọn demo cục bộ.`;
    $('#connection').textContent = 'Mất kết nối API';
    toast(error.message, true);
  }
  if (run !== refreshId) return;
  render(); updateOfflineStatus();
  void refreshSearchIndex(run, state.source, [...state.pois]);
  usage.presence(visitorVisible()); usage.flush();
}
function render() { updateLanguage(); renderMap(); renderDetail(); renderList(); $('#stop-count').textContent = String(state.pois.length).padStart(2, '0'); }
function selectPoi(id, play = false) {
  if (state.selected !== id) stopAudio();
  state.selected = id; state.route = null;
  const poi = selected();
  if (poi) { const u = new URL(location.href); u.searchParams.set('poi', poi.code); history.replaceState(null, '', u); }
  render();
  if (play) playAudio();
}
function renderList() {
  const pois = filtered();
  $('#results-count').textContent = `${pois.length} / ${state.pois.length} ${t('point')}`;
  $('#stop-list').innerHTML = pois.length ? pois.map(p => `<button class="stop-card ${p.id === state.selected ? 'selected' : ''}" data-id="${esc(p.id)}" aria-pressed="${p.id === state.selected}"><span class="stop-num">${esc(stopNumber(p))}</span><span><span class="stop-name">${esc(p.name)}</span><span class="stop-kind">${esc(group(p.categoryId))}</span></span></button>`).join('') : `<p class="empty">${esc(t('empty'))}</p>`;
}
function renderMap() {
  updateOutdoor();
  $('#map-view-title').textContent = translateUI(outdoorVisible ? 'Bản đồ OpenStreetMap' : 'Sơ đồ tham quan',state.lang);
  $('#map-caption').textContent = translateUI(outdoorVisible ? 'Bản đồ OpenStreetMap' : 'Sơ đồ tham quan · không theo tỉ lệ địa lý',state.lang);
  $('#map-legend').hidden = outdoorVisible || !state.route;
  $('#map').innerHTML = renderSchematic({pois:state.pois,visibleIds:filtered().map(p=>p.id),selectedId:state.selected,routeCodes:state.route?.codes || [],zoom,
    title:translateUI('Sơ đồ tham quan',state.lang),note:translateUI('SƠ ĐỒ · KHÔNG THEO TỈ LỆ',state.lang)});
}
function renderDetail() {
  const p = selected();
  if (!p) { $('#detail').innerHTML = `<div class="empty">↟<br>${esc(t('choose'))}</div>`; return; }
  const kind = p.categoryId === 3 ? 'water' : p.categoryId === 1 ? 'facility' : '';
  $('#detail').innerHTML = `<div class="detail-art ${kind}"><span class="detail-number">${esc(stopNumber(p).padStart(2, '0'))}</span><span class="detail-tag">${esc(LANGS[p.lang] || LANGS[state.lang])}</span></div><div class="detail-body"><p class="detail-category">${esc(group(p.categoryId))}</p><h2>${esc(p.name || p.code)}</h2><p class="script-text">${esc(p.translationMissing ? 'Chưa có lời thuyết minh cho ngôn ngữ này.' : p.scriptText || p.summary)}</p><div class="detail-info"><span>⌖ ${esc(p.geoVerified ? t('verified') : documentCoordinates(p) ? translateUI('Tọa độ theo tài liệu',state.lang) : p.geoSourceUrl ? translateUI('Tọa độ đối chiếu nguồn bản đồ',state.lang) : t('schematic'))}</span><span>◎ ${esc(LANGS[p.lang] || LANGS[state.lang])}</span></div><div class="player"><button id="play" class="button primary" ${p.translationMissing ? 'disabled' : ''}>${esc(state.playing ? t('stop') : t('play'))}</button><div class="player-options"><label class="check" title="${esc(t('autoHint'))}"><input id="auto" type="checkbox" ${state.auto ? 'checked' : ''}>${esc(t('auto'))}</label><button id="share" class="button quiet">${esc(t('share'))}</button></div><p id="player-status" class="player-status" role="status">${esc(state.playing ? t('narration') : p.audio?.url ? 'MP3 · Audio' : 'TTS · Giọng đọc của trình duyệt')}</p><div class="route-controls"><select id="route-from" aria-label="${esc(t('from'))}"><option value="0">${esc(t('center'))}</option>${state.pois.filter(x => Number(x.sortOrder) !== 1).map(x => `<option value="${esc(routeNode(x))}" ${state.from === routeNode(x) ? 'selected' : ''}>${esc(stopNumber(x))} · ${esc(x.name)}</option>`).join('')}</select><button id="route" class="button">↗ ${esc(t('route'))}</button></div><p class="route-result" id="route-result">${state.route ? esc(`${state.route.km.toFixed(1)} ${t('distance')} ${state.route.minutes} ${t('minute')}. ${t('map')}`) : ''}</p></div></div>`;
  $('#share').ariaLabel = t('share'); $('#share').title = t('share');
  const sourceControl = document.createElement('label');
  sourceControl.className = 'field';
  sourceControl.innerHTML = `<span>Nguồn giọng đọc</span><select id="voice-mode"><option value="auto">Tự động · tiếng Việt dùng TTS trình duyệt, ngôn ngữ khác ưu tiên MP3</option><option value="browser">Giọng trình duyệt · như cat-tien-app</option><option value="mp3">MP3 đã lưu · dùng ngoại tuyến</option></select>`;
  $('#player-status').before(sourceControl);
  $('#voice-mode').value = voiceMode;
  const prefersVietnameseTts = state.lang === 'vi' && voiceMode === 'auto' && 'speechSynthesis' in window;
  if (!state.playing) $('#player-status').textContent = prefersVietnameseTts ? 'TTS · Giọng tiếng Việt của trình duyệt' : p.audio?.url && voiceMode !== 'browser' ? `${p.audio.provider === 'GEMINI' ? 'Google AI Studio' : p.audio.provider || 'MP3'} · ${p.audio.voiceName || 'MP3'}` : voiceMode==='auto' && runtimeConfig.tts_provider==='GEMINI' && !p.audio?.url ? 'MP3 Google chưa sẵn sàng · sẽ thử giọng thiết bị cùng ngôn ngữ' : voiceMode === 'mp3' && p.audio?.url ? 'MP3 · Audio' : 'TTS · Giọng đọc của trình duyệt';
  if(!state.playing && voiceMode==='auto' && p.audio?.provider!=='GEMINI' && runtimeConfig.tts_paused_until)$('#player-status').textContent+=' '+formatUI('Hạn mức Google đã hết. Có thể tiếp tục từ {0}.',[new Date(runtimeConfig.tts_paused_until).toLocaleString(LOCALES[state.lang])],state.lang);
}
function stopAudio() {
  audioRun++;
  counter.cancel();
  state.playing = false;
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; }
  window.speechSynthesis?.cancel();
  if ($('#play')) $('#play').textContent = t('play');
}
function playbackDone() { counter.cancel(); state.playing = false; if ($('#play')) $('#play').textContent = t('play'); }
async function speak(p, onStarted) {
  const run = audioRun;
  if (!('speechSynthesis' in window)) { playbackDone(); toast('Trình duyệt chưa hỗ trợ đọc văn bản. Hãy dùng bản audio từ backend.', true); return; }
  const voices = await loadVoices(window.speechSynthesis);
  if (run !== audioRun || !state.playing) return;
  const utterance = new SpeechSynthesisUtterance(p.scriptText || p.summary || p.name);
  utterance.lang = LOCALES[p.lang] || LOCALES[state.lang];
  const voice = selectVoice(voices, utterance.lang);
  // Browsers can silently use their default voice when the requested locale
  // is missing. Never play a different language by accident.
  if (!voice) {
    playbackDone();
    toast(`Thiết bị chưa có giọng đọc ${LANGS[p.lang] || p.lang}. Hãy cài giọng này trong cài đặt hệ điều hành hoặc chọn MP3 thuyết minh.`, true);
    return;
  }
  if (voice) utterance.voice = voice;
  utterance.onstart = onStarted;
  utterance.onend = () => { if (run === audioRun) playbackDone(); };
  utterance.onerror = e => { if (run === audioRun && !['canceled', 'interrupted'].includes(e.error)) { playbackDone(); toast('Không phát được giọng đọc. Kiểm tra giọng ngôn ngữ đã cài trên máy.', true); } };
  speechSynthesis.speak(utterance);
  $('#player-status').textContent = voice ? `TTS · ${voice.name}` : `TTS · ${utterance.lang} · phụ thuộc giọng có trên máy`;
}
async function playAudio() {
  const p = selected(); if (!p) return;
  if (p.translationMissing || p.lang !== state.lang) { toast('Bản thuyết minh ngôn ngữ đã chọn chưa có.', true); return; }
  stopAudio(); state.playing = true; $('#play').textContent = t('stop');
  const onStarted = counter.begin(p, settings.mode);
  const url = safeURL(p.audio?.url);
  // In automatic mode Vietnamese uses the device's vi-VN browser voice.
  // Explicit MP3 mode remains available; all other language/source behavior is unchanged.
  const source = state.lang === 'vi' && voiceMode === 'auto' && 'speechSynthesis' in window
    ? 'browser'
    : playbackSource(voiceMode, Boolean(url), 'speechSynthesis' in window);
  if (!source) { playbackDone(); toast('Trình duyệt chưa hỗ trợ giọng đọc và điểm này chưa có MP3.', true); return; }
  if (source === 'mp3') {
    const current = audio = new Audio(url);
    current.onplaying = onStarted;
    current.onended = playbackDone;
    const fallback = () => { if (audio === current && state.playing) { audio = null; current.onerror = null; current.pause(); current.removeAttribute('src'); current.load(); toast('MP3 không phát được. Đang thử giọng thiết bị cùng ngôn ngữ.', true); speak(p, onStarted); } };
    current.onerror = fallback;
    try { await current.play(); if ($('#player-status') && audio === current) $('#player-status').textContent = p.audio?.provider === 'GEMINI' ? `Google AI Studio · ${p.audio.voiceName || 'MP3'}` : 'MP3 · Audio'; } catch { fallback(); }
  } else speak(p, onStarted);
}
function toggleGPS() {
  if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; state.gps = null; state.hits.clear(); updateOutdoor(); $('#gps').textContent = '⌖ Bật GPS'; return; }
  if (!navigator.geolocation) { toast('Trình duyệt chưa hỗ trợ GPS.', true); return; }
  $('#gps').textContent = '⌖ Đang lấy vị trí…';
  watchId = navigator.geolocation.watchPosition(pos => {
    state.gps = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    updateOutdoor();
    $('#gps').textContent = `⌖ GPS ±${Math.round(pos.coords.accuracy)} m · Tắt`;
    sharePosition(pos); if (!state.auto) return;
    for (const p of state.pois.filter(p => p.geoVerified && p.lat != null && p.lng != null)) {
      const near = haversine(state.gps, p) <= (p.triggerRadiusM || runtimeConfig.default_trigger_radius_m) && pos.coords.accuracy <= Math.max(30, p.triggerRadiusM || 10);
      state.hits.set(p.id, near ? (state.hits.get(p.id) || 0) + 1 : 0);
      if (near && state.hits.get(p.id) >= 2 && Date.now() - (state.cooldown.get(p.id) || 0) > runtimeConfig.replay_audio_cooldown_min * 60 * 1000) { state.cooldown.set(p.id, Date.now()); selectPoi(p.id, true); break; }
    }
  }, error => { toast(`GPS: ${error.message}`, true); if (watchId !== null) navigator.geolocation.clearWatch(watchId); watchId = null; $('#gps').textContent = '⌖ Bật GPS'; }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
}
async function showAdmin() {
  const run = ++adminRefreshId;
  $('#admin-error').textContent = ''; $('#admin-list').innerHTML = '<tr><td colspan="7">Đang tải…</td></tr>';
  $('#admin-note').textContent = settings.mode === 'demo' ? 'Chế độ demo: nội dung riêng trong trình duyệt; thống kê dùng chung trên máy chủ web.' : 'Dữ liệu backend thật. Admin quản lý nội dung và vẫn dùng được trang Khám phá.';
  loadAnalytics();
  try {
    const rows = await getAdminPois();
    if (run !== adminRefreshId) return;
    state.admin = rows;
    renderAnalytics();
    $('#admin-stats').innerHTML = [[rows.length, 'Điểm tham quan'], [rows.filter(p => p.status === 'PUBLISHED').length, 'Đã xuất bản'], [rows.reduce((n, p) => n + p.translations.length, 0), 'Bản dịch']].map(([n, label]) => `<div class="stat"><strong>${n}</strong><span>${label}</span></div>`).join('');
    $('#admin-list').innerHTML = rows.length ? rows.map(p => `<tr><td>${esc(p.code)}</td><td><strong>${esc(localize(p, state.lang).name)}</strong></td><td>${esc(group(p.categoryId))}</td><td><span class="badge ${p.status !== 'PUBLISHED' ? 'draft' : ''}">${esc(p.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp')}</span></td><td>${p.translations.length} / 5</td><td>${p.geoVerified ? '✓ Đã xác thực' : 'Chưa xác thực'}</td><td><button class="button" data-edit="${esc(p.id)}">Sửa</button>${settings.mode === 'api' ? `<button class="button" data-upload="${esc(p.id)}">Tải MP3</button><button class="button" data-generate="${esc(p.id)}">Tạo MP3 miễn phí</button><button class="button" data-regen="${esc(p.id)}">Tạo lại audio lỗi</button>` : ''}<button class="button" data-delete="${esc(p.id)}">Xóa</button></td></tr>`).join('') : '<tr><td colspan="7">Chưa có điểm tham quan. Bấm Thêm điểm để bắt đầu.</td></tr>';
  } catch (error) {
    if (run !== adminRefreshId) return;
    state.admin = []; $('#admin-list').innerHTML = ''; $('#admin-stats').innerHTML = ''; $('#admin-error').textContent = error.message;
  }
}
async function loadAnalytics() {
  const run = ++analyticsRun, mode = settings.mode;
  $('#analytics-refresh').disabled = true;
  try {
    const data = await getAnalytics();
    if (run !== analyticsRun || mode !== settings.mode) return;
    analyticsData = data; $('#analytics-error').textContent = ''; renderAnalytics();
    $('#analytics-updated').textContent = `${mode === 'demo' ? 'Demo · thống kê chung trên máy chủ web này' : 'Backend · thống kê tập trung'} · Cập nhật ${new Date(data.updatedAt).toLocaleTimeString('vi-VN')}`;
  } catch (error) {
    if (run !== analyticsRun || mode !== settings.mode) return;
    analyticsData = null; renderAnalytics(); $('#analytics-updated').textContent = 'Chưa có số liệu cập nhật'; $('#analytics-error').textContent = error.message;
  } finally { if (run === analyticsRun) $('#analytics-refresh').disabled = false; }
}
function renderAnalytics() {
  const values = analyticsData ? [analyticsData.activeUsers, analyticsData.totalListens, analyticsData.todayListens] : ['—', '—', '—'];
  $('#activity-stats').innerHTML = values.map((value, index) => `<div class="stat ${index === 0 ? 'online-stat' : ''}"><strong>${esc(value)}</strong><span>${['Người đang sử dụng', 'Tổng lượt nghe', 'Lượt nghe hôm nay'][index]}</span></div>`).join('');
  if (!analyticsData) { $('#analytics-list').innerHTML = '<tr><td colspan="4">Chưa tải được thống kê.</td></tr>'; return; }
  const rows = new Map(analyticsData.rows.map(row => [`${row.poiId}:${row.lang}`, { ...row }]));
  for (const poi of state.admin.filter(p => p.status === 'PUBLISHED')) for (const tr of poi.translations) {
    const key = `${poi.id}:${tr.langCode}`;
    if (!rows.has(key)) rows.set(key, { poiId: poi.id, code: poi.code, name: tr.name, lang: tr.langCode, count: 0 });
  }
  const lang = $('#analytics-language').value;
  const list = [...rows.values()].filter(row => lang === 'all' || row.lang === lang).sort((a, b) => b.count - a.count || a.code.localeCompare(b.code, undefined, { numeric: true }) || a.lang.localeCompare(b.lang));
  $('#analytics-list').innerHTML = list.length ? list.map(row => `<tr><td>${esc(row.code)}</td><td>${esc(row.name)}</td><td>${esc(LANGS[row.lang] || row.lang)}</td><td><strong>${esc(row.count)}</strong></td></tr>`).join('') : '<tr><td colspan="4">Chưa có bản thuyết minh trong ngôn ngữ này.</td></tr>';
}
function visitorVisible() { return state.tab === 'visitor' && document.visibilityState === 'visible' && state.pois.length > 0; }
function renderJoinQR() {
  try {
    const url = new URL(joinURL($('#join-url').value));
    url.searchParams.set('source', settings.mode);
    joinLink = url.href;
    const svg = qrSVG(joinLink);
    $('#join-qr').innerHTML = svg;
    if (joinBlobUrl) URL.revokeObjectURL(joinBlobUrl);
    joinBlobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    $('#join-download').href = joinBlobUrl; $('#join-download').hidden = false; $('#join-copy').disabled = false;
    $('#join-url').value = joinLink;
    $('#join-note').textContent = isLoopback(joinLink) ? 'Địa chỉ này chỉ truy cập trên máy đang chạy. Để quét bằng điện thoại, nhập URL công khai hoặc IP LAN mà điện thoại truy cập được.' : `Mã mở chế độ ${settings.mode === 'api' ? 'backend' : 'demo'}. Điện thoại cần truy cập được địa chỉ này.`;
  } catch (error) { joinLink = ''; $('#join-qr').textContent = ''; $('#join-download').hidden = true; $('#join-copy').disabled = true; $('#join-note').textContent = `Không tạo được mã QR: ${error.message}`; }
}
function openEditor(poi) {
  state.isNew = !poi;
  state.editing = structuredClone(poi || { id: null, code: '', categoryId: 2, status: 'DRAFT', triggerRadiusM: 10, geoVerified: false, lat: null, lng: null, schematic: null, translations: [] });
  const p = state.editing, form = $('#editor-form'); form.reset();
  $('#editor-title').textContent = poi ? `Chỉnh sửa điểm ${p.code}` : 'Thêm điểm tham quan';
  for (const key of ['code', 'categoryId', 'status', 'triggerRadiusM', 'lat', 'lng']) form.elements.namedItem(key).value = p[key] ?? '';
  form.elements.namedItem('x').value = p.schematic?.[0] ?? '';
  form.elements.namedItem('y').value = p.schematic?.[1] ?? '';
  form.elements.namedItem('geoVerified').checked = p.geoVerified;
  $('#translation-fields').innerHTML = Object.entries(LANGS).map(([lang, label], index) => {
    const tr = p.translations.find(t => t.langCode === lang), required = tr ? 'required' : '';
    return `<details class="translation" ${index === 0 ? 'open' : ''}><summary>${esc(label)}${tr ? ' · đã có nội dung' : ' · tùy chọn'}</summary><label class="field">Tên điểm<input name="name-${lang}" maxlength="200" value="${esc(tr?.name || '')}" ${required}></label><label class="field">Mô tả ngắn<input name="summary-${lang}" maxlength="500" value="${esc(tr?.summary || '')}"></label><label class="field">Lời thuyết minh<textarea name="script-${lang}" ${required}>${esc(tr?.scriptText || '')}</textarea></label></details>`;
  }).join('');
  $('#editor-error').textContent = ''; $('#editor-dialog').showModal();
}
async function submitEditor(event) {
  event.preventDefault();
  const fields = new FormData(event.target), n = key => fields.get(key).trim() === '' ? null : Number(fields.get(key));
  const poi = { ...state.editing, code: fields.get('code').trim(), categoryId: n('categoryId'), status: fields.get('status'), triggerRadiusM: n('triggerRadiusM'), lat: n('lat'), lng: n('lng'), geoVerified: fields.get('geoVerified') === 'on', schematic: n('x') === null && n('y') === null ? null : [n('x'), n('y')], translations: Object.keys(LANGS).map(lang => ({ langCode: lang, name: fields.get(`name-${lang}`).trim(), summary: fields.get(`summary-${lang}`).trim(), scriptText: fields.get(`script-${lang}`).trim() })).filter(tr => tr.name || tr.scriptText || tr.summary) };
  $('#editor-save').disabled = true; $('#editor-error').textContent = '';
  try {
    validatePoi(poi, settings.mode === 'api');
    await savePoi(poi, state.isNew);
    $('#editor-dialog').close(); toast('Đã lưu nội dung.'); await refresh(); await showAdmin();
  } catch (error) { $('#editor-error').textContent = error.message; }
  finally { $('#editor-save').disabled = false; }
}
function closeCamera() { cameraStream?.getTracks().forEach(track => track.stop()); cameraStream = null; cancelAnimationFrame(scanFrame); $('#qr-video').srcObject = null; $('#qr-video').hidden = true; }
async function resolveQR(input) {
  const value = qrValue(input);
  let p;
  if (value.code) p = state.pois.find(p => p.code === value.code);
  else if (settings.mode === 'demo') p = state.pois.find(p => p.code === (value.token === 'demo-bausau-001' ? '9' : value.token.replace(/^demo-poi-/, '')));
  else {
    let match;
    try { match = await api(`qr/${encodeURIComponent(value.token)}`, {}, true); }
    catch (error) { const saved = JSON.parse(localStorage.getItem('sag:qr:api') || '[]'); match = saved.find(q => q.token === value.token); if (!match) throw error; }
    if (match.kind === 'GATE') throw new Error('Đây là mã cổng vào, không phải mã điểm tham quan.');
    p = state.pois.find(p => p.id === match.poiId);
  }
  if (!p) throw new Error('Không tìm thấy điểm đã xuất bản tương ứng với mã.');
  $('#qr-dialog').close(); closeCamera(); selectPoi(p.id, true); $('#detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
async function startCamera() {
  const message = $('#qr-message');
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia || !(await BarcodeDetector.getSupportedFormats()).includes('qr_code')) { message.textContent = 'Trình duyệt này chưa hỗ trợ quét QR bằng camera. Hãy nhập hoặc dán nội dung mã ở trên.'; return; }
  closeCamera();
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    $('#qr-video').srcObject = cameraStream; $('#qr-video').hidden = false; await $('#qr-video').play();
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const scan = async () => {
      if (!cameraStream) return;
      try { const codes = await detector.detect($('#qr-video')); if (codes[0]) { closeCamera(); await resolveQR(codes[0].rawValue); return; } }
      catch (error) { message.textContent = error.message; closeCamera(); return; }
      scanFrame = requestAnimationFrame(scan);
    };
    message.textContent = 'Đưa mã QR vào giữa khung hình.'; scanFrame = requestAnimationFrame(scan);
  } catch (error) { closeCamera(); message.textContent = `Không mở được camera: ${error.message}`; }
}
function updateOfflineStatus() {
  const date = localStorage.getItem(`sag:pack-date:${settings.mode}`);
  const meta=JSON.parse(localStorage.getItem(`sag:pack-meta:${settings.mode}`)||'null');
  if(date&&seed?.catalogVersion&&meta?.catalogVersion!==seed.catalogVersion){$('#offline-status').textContent=translateUI('Danh sách điểm đã thay đổi. Hãy lưu lại gói ngoại tuyến.',state.lang);return;}
  $('#offline-status').textContent = date && meta?.provider==='GEMINI' ? formatUI('Gói ngoại tuyến: {0} audio Google, {1} bản chưa sẵn sàng. Lưu lúc {2}.',[meta.audioCount,meta.audioMissing,new Date(date).toLocaleString(LOCALES[state.lang])],state.lang) : date ? formatUI('Đã lưu gói {0} lúc {1}. Giọng TTS phụ thuộc giọng cài trên thiết bị.',[settings.mode,new Date(date).toLocaleString(LOCALES[state.lang])],state.lang) : translateUI('Lưu nội dung 5 ngôn ngữ và audio MP3 sẵn có. Giọng đọc của trình duyệt có thể cần mạng.',state.lang);
}

$('#visitor-tab').onclick = () => { state.tab = 'visitor'; $('#visitor').hidden = false; $('#admin').hidden = true; $('#visitor-tab').classList.add('active'); $('#admin-tab').classList.remove('active'); $('#visitor-tab').ariaPressed = 'true'; $('#admin-tab').ariaPressed = 'false'; usage.presence(visitorVisible()); };
$('#admin-tab').onclick = async () => { if(settings.mode!=='api'||!token()){$('#settings').click();$('#login-status').textContent='Khách sử dụng không cần đăng nhập. Chỉ admin đăng nhập để quản lý.';return;}try{await api('auth/me');}catch(error){$('#settings').click();$('#login-status').textContent=error.message;return;} stopAudio(); state.tab = 'admin'; usage.presence(false); $('#visitor').hidden = true; $('#admin').hidden = false; $('#admin-tab').classList.add('active'); $('#visitor-tab').classList.remove('active'); $('#visitor-tab').ariaPressed = 'false'; $('#admin-tab').ariaPressed = 'true'; showAdmin(); };
$('#search').oninput = event => {
  state.query = event.target.value;
  $('#search-clear').hidden = !state.query;
  if (state.query.trim()) {
    const matches = filtered();
    const previousSelection = state.selected;
    state.selected = matches.length === 1
      ? matches[0].id
      : matches.some(p => p.id === state.selected) ? state.selected : null;
    if (state.selected !== previousSelection) state.route = null;
    renderDetail();
  }
  renderMap();
  renderList();
};
$('#search-clear').onclick = () => { $('#search').value = ''; state.query = ''; $('#search-clear').hidden = true; renderMap(); renderList(); $('#search').focus(); };
$('#filters').onclick = event => { const b = event.target.closest('[data-category]'); if (!b) return; state.category = Number(b.dataset.category); $$('#filters button').forEach(x => { const active = x === b; x.classList.toggle('active', active); x.ariaPressed = String(active); }); renderMap(); renderList(); };
const changeLanguage = async lang => { if(!LANGS[lang]||lang===state.lang)return; stopAudio(); state.lang = lang; localStorage.setItem('sag:lang', state.lang); await refresh();if(state.tab==='admin')await showAdmin(); };
languageSwitcher.onclick = event => { const button=event.target.closest('[data-lang]');if(button)changeLanguage(button.dataset.lang); };
$('#stop-list').onclick = event => { const b = event.target.closest('[data-id]'); if (b) selectPoi(b.dataset.id); };
$('#map').onclick = event => { const b = event.target.closest('[data-id]'); if (b) selectPoi(b.dataset.id); };
$('#map').onkeydown = event => { if (['Enter', ' '].includes(event.key) && event.target.matches('[data-id]')) { event.preventDefault(); selectPoi(event.target.dataset.id); } };
$('#map-reset').onclick = () => {
  zoom = 1;
  state.route = null;
  state.selected = null;
  state.query = '';
  state.category = 0;
  $('#search').value = '';
  $('#search-clear').hidden = true;
  $$('#filters [data-category]').forEach(button => {
    const active = button.dataset.category === '0';
    button.classList.toggle('active', active);
    button.ariaPressed = String(active);
  });
  renderMap();
  renderList();
  renderDetail();
  outdoorMap.reset();
};
$('#map-mode').onclick = () => {
  try {
    outdoorMap.show(!outdoorVisible);
    outdoorVisible = !outdoorVisible;
    $('#map').hidden = outdoorVisible;
    $('#map-mode').textContent = outdoorVisible ? 'Sơ đồ tham quan' : 'Bản đồ OpenStreetMap';
    $('#map-mode').ariaPressed = String(outdoorVisible);
    renderMap();
  } catch (error) {
    outdoorVisible = false; outdoorMap.show(false); $('#map').hidden = false; renderMap(); toast(error.message, true);
  }
};
$('#gps').onclick = toggleGPS;
$('#detail').onclick = async event => {
  const b = event.target.closest('button');
  if (!b) return;
  if (b.id === 'play') { if (state.playing) stopAudio(); else playAudio(); }
  if (b.id === 'route') { if (outdoorVisible) $('#map-mode').click(); state.from = $('#route-from').value; state.route = routeTo(seed.edges, state.from, routeNode(selected())); if (!state.route) toast(t('noRoute'), true); renderMap(); renderDetail(); }
  if (b.id === 'share') { try { const u = new URL(location.href); u.searchParams.set('poi', selected().code); await navigator.clipboard.writeText(u.href); toast(t('share')); } catch { toast('Không sao chép được. Bạn có thể lấy liên kết trên thanh địa chỉ.', true); } }
};
$('#detail').onchange = event => { if (event.target.id === 'voice-mode') { stopAudio(); voiceMode = ['mp3','browser'].includes(event.target.value) ? event.target.value : 'auto'; localStorage.setItem('sag:voice-mode-v2', voiceMode); renderDetail(); } if (event.target.id === 'auto') { state.auto = event.target.checked; if (state.auto && watchId === null) toggleGPS(); } if (event.target.id === 'route-from') state.from = event.target.value; };
$('#settings').onclick = () => { $(`#settings-form input[value="${settings.mode}"]`).checked = true; $('#admin-token').value = token(); $('#settings-dialog').showModal(); };
$('#settings-form').onsubmit = async event => { event.preventDefault(); stopAudio(); const mode = new FormData(event.target).get('mode'); saveSettings(mode); const url = new URL(location.href); if (url.searchParams.has('source')) { url.searchParams.set('source', mode); history.replaceState(null, '', url); } usage.changeMode(); analyticsData = null; renderAnalytics(); sessionStorage.setItem('sag:token', $('#admin-token').value.trim()); state.selected = null; state.hits.clear(); $('#settings-dialog').close(); await refresh(); if (state.tab === 'admin') await showAdmin(); };
$$('.close-dialog').forEach(b => b.onclick = () => b.closest('dialog').close());
$('#qr-open').onclick = async () => {
  $('#qr-message').textContent = '';
  try { const response = await fetch('/web-config', {signal:AbortSignal.timeout(2500)}); const config = response.ok ? await response.json() : null; if (config?.joinUrl) defaultJoinUrl = joinURL(config.joinUrl); } catch {}
  const saved = localStorage.getItem('sag:join-url');
  let preferred = saved || defaultJoinUrl;
  try { if (saved && isLoopback(saved) && !isLoopback(defaultJoinUrl)) preferred = defaultJoinUrl; } catch { preferred = defaultJoinUrl; }
  $('#join-url').value = preferred; renderJoinQR(); $('#qr-dialog').showModal();
};
$('#join-form').onsubmit = event => { event.preventDefault(); renderJoinQR(); if (joinLink) localStorage.setItem('sag:join-url', joinLink); };
$('#join-copy').onclick = async () => { try { await navigator.clipboard.writeText(joinLink); toast('Đã sao chép liên kết tham gia.'); } catch { toast('Hãy sao chép địa chỉ trong ô Địa chỉ web tham gia.', true); } };
$('#analytics-refresh').onclick = loadAnalytics;
$('#analytics-language').onchange = renderAnalytics;
$('#qr-dialog').addEventListener('close', closeCamera);
$('#qr-form').onsubmit = async event => { event.preventDefault(); try { await resolveQR($('#qr-input').value); } catch (error) { $('#qr-message').textContent = error.message; } };
$('#camera-start').onclick = () => startCamera().catch(error => $('#qr-message').textContent = error.message);
$('#offline-save').onclick = async () => {
  const b = $('#offline-save'); b.disabled = true;
  try {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) { const check=await fetch('./offline-guide.zip',{method:'HEAD'});if(!check.ok)throw new Error('Gói audio tải về chưa được tạo. Cần localhost hoặc HTTPS để lưu PWA.');const link=document.createElement('a');link.href='./offline-guide.zip';link.download='CatTien-Google-Audio.zip';link.click();toast('Giải nén gói tải về, mở index.html để nghe ngoại tuyến.');return; }
    await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Bộ nhớ ngoại tuyến chưa sẵn sàng. Thử tải lại trang.')), 10000))]);
    const result = await saveOffline(lang => $('#offline-status').textContent = `Đang lưu ${LANGS[lang]}…`, {provider:runtimeConfig.tts_provider==='GEMINI'?'GEMINI':undefined});
    let qrWarning = '';
    if (settings.mode === 'api') { try { localStorage.setItem('sag:qr:api', JSON.stringify(await api('qr', {}, true))); } catch { qrWarning = ' Không lưu được bảng mã QR.'; } }
    updateOfflineStatus();
    const message = formatUI('Đã tải {0} audio Google. Còn {1} bản chưa được tạo do hạn mức.',[result.audioCount,result.audioMissing||0],state.lang)+qrWarning;
    $('#offline-status').textContent += ` ${message}`; toast(message, Boolean(result.audioFailed || qrWarning));
  } catch (error) { toast(error.message, true); $('#offline-status').textContent = error.message; }
  finally { b.disabled = false; }
};
$('#new-poi').onclick = () => openEditor();
$('#editor-form').onsubmit = submitEditor;
$('#admin-list').onclick = async event => {
  const b = event.target.closest('button'); if (!b) return;
  if (b.dataset.edit) openEditor(state.admin.find(p => p.id === b.dataset.edit));
  if (b.dataset.delete) {
    const poi = state.admin.find(p => p.id === b.dataset.delete);
    $('#confirm-text').textContent = `${poi.code} · ${localize(poi, state.lang).name}. Điểm sẽ được gỡ khỏi trang tham quan.`;
    const dialog = $('#confirm-dialog'); dialog.returnValue = ''; dialog.showModal();
    dialog.addEventListener('close', async () => { if (dialog.returnValue !== 'delete') return; b.disabled = true; try { await deletePoi(poi.id); toast('Đã xóa điểm.'); await refresh(); await showAdmin(); } catch (error) { toast(error.message, true); b.disabled = false; } }, { once: true });
  }
  if (b.dataset.regen) { b.disabled = true; try { const result = await api(`admin/pois/${b.dataset.regen}/audios/regenerate`, { method: 'POST' }); toast(`Đã đưa ${result.queued} audio lỗi vào hàng đợi tạo lại.`); } catch (error) { toast(error.message, true); } finally { b.disabled = false; } }
};
window.addEventListener('offline', () => { $('#connection').textContent = 'Ngoại tuyến'; });
window.addEventListener('online', () => { refresh(); usage.flush(); });
document.addEventListener('visibilitychange', () => { usage.presence(visitorVisible(), document.visibilityState !== 'visible'); if (state.tab === 'admin' && document.visibilityState === 'visible') loadAnalytics(); });
let usageTimer;
function startUsageLoop() { clearInterval(usageTimer); usageTimer = setInterval(() => { usage.presence(visitorVisible()); usage.flush(); if (state.tab === 'admin' && document.visibilityState === 'visible') loadAnalytics(); }, 25000); }
window.addEventListener('pageshow', startUsageLoop);
window.addEventListener('pagehide', () => { usage.presence(false, true); clearInterval(usageTimer); stopAudio(); closeCamera(); if (watchId !== null) navigator.geolocation.clearWatch(watchId); });
try {
  setupAdminTools({ refresh, showAdmin, toast });
  await loadRuntimeConfig();
  seed = await loadSeed();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => toast('Không bật được bộ nhớ ngoại tuyến. Kiểm tra localhost hoặc HTTPS.', true));
  await refresh();
  if(settings.mode==='api' && !localStorage.getItem('sag:entry-download-seen') && state.pois.some(p=>p.audio?.provider==='GEMINI')) {
    const entry=document.createElement('dialog');entry.innerHTML='<h2>Lưu giọng Google trước khi vào rừng</h2><p>MP3 đã tải dùng được ngoại tuyến. Bài chưa có MP3 chỉ đọc được nếu thiết bị đã cài giọng cùng ngôn ngữ.</p><div class="dialog-actions"><button class="button" data-later>Để sau</button><button class="button primary" data-save>Tải gói thuyết minh</button></div>';
    document.body.append(entry);entry.querySelector('[data-later]').onclick=()=>{localStorage.setItem('sag:entry-download-seen','1');entry.close();};entry.querySelector('[data-save]').onclick=()=>{localStorage.setItem('sag:entry-download-seen','1');entry.close();$('#offline-save').click();};entry.showModal();
  }
  startUsageLoop();
  fetch('/web-config', { signal: AbortSignal.timeout(2500) }).then(response => response.ok ? response.json() : null).then(config => { if (config?.joinUrl) defaultJoinUrl = joinURL(config.joinUrl); }).catch(() => {});
} catch (error) { $('#data-note').textContent = error.message; toast(error.message, true); }
