import {haversine} from './core.mjs';
export const GPS_OPTIONS = Object.freeze({ enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });

export function validGpsPosition(position,now=Date.now()) {
  const c=position?.coords;
  return Boolean(c && Number.isFinite(c.latitude) && Math.abs(c.latitude)<=90 && Number.isFinite(c.longitude) && Math.abs(c.longitude)<=180
    && Number.isFinite(c.accuracy) && c.accuracy>=0 && Number.isFinite(position.timestamp) && now-position.timestamp<=10000 && position.timestamp-now<=5000);
}
export function createGpsTrigger({now=Date.now}={}) {
  const hits=new Map(),played=new Map(),attempts=new Map();let timestamp=0;
  return {
    reset(){hits.clear();timestamp=0;},
    played(id){played.set(id,now());},
    next(pois,position,{radius=10,cooldownMin=30}={}) {
      if(!validGpsPosition(position,now())){hits.clear();return null;}
      if(position.timestamp<=timestamp)return null;
      if(position.timestamp-timestamp>15000)hits.clear();
      timestamp=position.timestamp;
      const here={lat:position.coords.latitude,lng:position.coords.longitude},candidates=[];
      for(const p of pois.filter(hasVerifiedGps)) {
        const r=p.triggerRadiusM||radius,d=haversine(here,p);
        const near=d<=r && position.coords.accuracy<=Math.max(30,r);
        hits.set(p.id,near?(hits.get(p.id)||0)+1:0);
        if(hits.get(p.id)>=2 && now()-(played.get(p.id)??-Infinity)>=cooldownMin*60000 && now()-(attempts.get(p.id)??-Infinity)>=10000)candidates.push({p,d});
      }
      candidates.sort((a,b)=>a.d-b.d);
      const p=candidates[0]?.p;
      if(p){attempts.set(p.id,now());hits.set(p.id,0);}
      return p||null;
    },
  };
}

const messages = {
  vi: {
    start: '⌖ Bật GPS', pending: '⌖ Đang lấy vị trí…', active: accuracy => `⌖ GPS ±${accuracy} m · Tắt`,
    unsupported: 'Trình duyệt chưa hỗ trợ định vị GPS.', permission: 'Chưa được cấp quyền vị trí. Hãy cho phép trong cài đặt trình duyệt.',
    unavailable: 'Không xác định được vị trí. Kiểm tra GPS và thử lại.', timeout: 'GPS chưa phản hồi. Hãy kiểm tra quyền vị trí và thử lại.',
    failed: 'Không lấy được vị trí GPS. Hãy thử lại.', autoUnavailable: 'Tự phát chưa khả dụng vì chưa có điểm nào được xác thực tọa độ GPS ngoài thực địa.',
  },
  en: {
    start: '⌖ Turn on GPS', pending: '⌖ Locating…', active: accuracy => `⌖ GPS ±${accuracy} m · Turn off`,
    unsupported: 'This browser does not support GPS location.', permission: 'Location permission is off. Allow it in your browser settings.',
    unavailable: 'Your location is unavailable. Check GPS and try again.', timeout: 'GPS did not respond. Check location permission and try again.',
    failed: 'Could not get your GPS location. Please try again.', autoUnavailable: 'Autoplay is unavailable because no stop has field-verified GPS coordinates.',
  },
  ja: {
    start: '⌖ GPSをオン', pending: '⌖ 位置を取得中…', active: accuracy => `⌖ GPS ±${accuracy} m · オフ`,
    unsupported: 'このブラウザーはGPS位置情報に対応していません。', permission: '位置情報の権限がありません。ブラウザー設定で許可してください。',
    unavailable: '位置情報を取得できません。GPSを確認して再試行してください。', timeout: 'GPSが応答しません。位置情報の権限を確認して再試行してください。',
    failed: 'GPS位置情報を取得できませんでした。再試行してください。', autoUnavailable: '現地で確認済みのGPS座標がないため、自動再生は利用できません。',
  },
  ko: {
    start: '⌖ GPS 켜기', pending: '⌖ 위치 확인 중…', active: accuracy => `⌖ GPS ±${accuracy} m · 끄기`,
    unsupported: '이 브라우저는 GPS 위치 기능을 지원하지 않습니다.', permission: '위치 권한이 없습니다. 브라우저 설정에서 허용해 주세요.',
    unavailable: '위치를 확인할 수 없습니다. GPS를 확인하고 다시 시도해 주세요.', timeout: 'GPS 응답이 없습니다. 위치 권한을 확인하고 다시 시도해 주세요.',
    failed: 'GPS 위치를 가져오지 못했습니다. 다시 시도해 주세요.', autoUnavailable: '현장에서 확인된 GPS 좌표가 없어 자동 재생을 사용할 수 없습니다.',
  },
  zh: {
    start: '⌖ 开启 GPS', pending: '⌖ 正在定位…', active: accuracy => `⌖ GPS ±${accuracy} 米 · 关闭`,
    unsupported: '此浏览器不支持 GPS 定位。', permission: '尚未获得位置权限，请在浏览器设置中允许。',
    unavailable: '无法获取位置，请检查 GPS 后重试。', timeout: 'GPS 暂无响应，请检查位置权限后重试。',
    failed: '无法获取 GPS 位置，请重试。', autoUnavailable: '目前没有经过实地验证的 GPS 坐标，暂不能自动播放。',
  },
};

export function gpsText(key, lang = 'vi', value) {
  const entry = messages[lang]?.[key] ?? messages.vi[key];
  return typeof entry === 'function' ? entry(value) : entry;
}

export function hasVerifiedGps(poi) {
  return poi?.geoVerified === true && Number.isFinite(poi.lat) && Number.isFinite(poi.lng)
    && Math.abs(poi.lat) <= 90 && Math.abs(poi.lng) <= 180;
}

export function startGpsWatch(geolocation, { onPosition, onError, options = GPS_OPTIONS }) {
  if (!geolocation || typeof geolocation.watchPosition !== 'function') throw new Error('GPS_NOT_SUPPORTED');
  let active = true;
  let watchId = null;
  const clear = () => {
    if (watchId === null) return;
    const id = watchId;
    watchId = null;
    try { geolocation.clearWatch(id); } catch { /* The watcher is already stopping. */ }
  };
  const stop = () => {
    if (!active) return false;
    active = false;
    clear();
    return true;
  };
  const fail = error => {
    if (!active) return;
    const recoverable=[2,3].includes(Number(error?.code));
    if(!recoverable){active = false;clear();}
    onError(error,{recoverable});
  };
  try {
    watchId = geolocation.watchPosition(position => { if (active) onPosition(position); }, fail, options);
    // A mock or unusual browser may call an error callback synchronously.
    if (!active) clear();
  } catch (error) {
    fail(error);
  }
  return { stop, get active() { return active; } };
}

export function gpsErrorKey(error) {
  return ({ 1: 'permission', 2: 'unavailable', 3: 'timeout' })[Number(error?.code)] || 'failed';
}
