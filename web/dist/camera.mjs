import jsQR from './vendor/jsqr.mjs';

const text = {
  vi: ['Đang xin quyền camera… Có thể đóng để hủy.', 'Đưa mã QR vào giữa khung hình.', 'Camera đã tắt.', 'Camera cần HTTPS hoặc localhost. Hãy nhập mã khi dùng HTTP qua Wi-Fi.', 'Thiết bị chưa hỗ trợ camera. Hãy nhập mã QR.', 'Chưa được cấp quyền camera. Kiểm tra quyền của trang trong trình duyệt.', 'Không tìm thấy camera trên thiết bị.', 'Camera đang bận hoặc không mở được. Đóng ứng dụng khác rồi thử lại.', 'Không đọc được hình từ camera. Hãy thử lại hoặc nhập mã.', 'Tắt camera'],
  en: ['Requesting camera access… Close to cancel.', 'Place a QR code in the frame.', 'Camera is off.', 'Camera requires HTTPS or localhost. Enter the code when using HTTP over Wi-Fi.', 'Camera is unsupported. Enter the QR code.', 'Camera access was denied. Check this site’s browser permissions.', 'No camera was found.', 'Camera is busy or unavailable. Close other apps and retry.', 'Could not read camera frames. Retry or enter the code.', 'Stop camera'],
  ja: ['カメラの許可を確認中…閉じてキャンセルできます。', 'QRコードを枠内に入れてください。', 'カメラを停止しました。', 'カメラにはHTTPSまたはlocalhostが必要です。HTTPではコードを入力してください。', 'カメラに対応していません。コードを入力してください。', 'カメラが許可されていません。ブラウザーの権限を確認してください。', 'カメラが見つかりません。', 'カメラを開けません。他のアプリを閉じて再試行してください。', '映像を読み取れません。再試行するかコードを入力してください。', 'カメラを停止'],
  ko: ['카메라 권한 확인 중…닫으면 취소됩니다.', 'QR 코드를 화면 중앙에 맞춰 주세요.', '카메라가 꺼졌습니다.', '카메라는 HTTPS 또는 localhost가 필요합니다. HTTP에서는 코드를 입력해 주세요.', '카메라를 지원하지 않습니다. 코드를 입력해 주세요.', '카메라 권한이 없습니다. 브라우저 설정을 확인해 주세요.', '카메라를 찾을 수 없습니다.', '카메라를 열 수 없습니다. 다른 앱을 닫고 다시 시도해 주세요.', '영상을 읽을 수 없습니다. 다시 시도하거나 코드를 입력해 주세요.', '카메라 끄기'],
  zh: ['正在请求相机权限…关闭即可取消。', '请将二维码放在画面中央。', '相机已关闭。', '相机需要HTTPS或localhost。使用HTTP时请输入代码。', '设备不支持相机，请输入代码。', '尚未获得相机权限，请检查浏览器设置。', '未找到相机。', '无法打开相机，请关闭其他应用后重试。', '无法读取画面，请重试或输入代码。', '关闭相机'],
};
const keys=['pending','scanning','stopped','insecure','unsupported','permission','notFound','busy','failed','stop'];
export const cameraText=(key,lang='vi')=>(text[lang]||text.vi)[keys.indexOf(key)]||text.vi[8];
export function cameraErrorKey(error) {
  return ({NotAllowedError:'permission',SecurityError:'permission',NotFoundError:'notFound',DevicesNotFoundError:'notFound',NotReadableError:'busy',TrackStartError:'busy',OverconstrainedError:'notFound',INSECURE_CONTEXT:'insecure',CAMERA_NOT_SUPPORTED:'unsupported'})[error?.name]||'failed';
}

export async function createQrDecoder({Detector=globalThis.BarcodeDetector,canvasFactory=()=>document.createElement('canvas')}={}) {
  let native;
  try { if(Detector && (await Detector.getSupportedFormats()).includes('qr_code'))native=new Detector({formats:['qr_code']}); } catch { /* Use the local decoder. */ }
  let canvas,ctx;
  return async video=>{
    if(video.readyState<2 || !video.videoWidth || !video.videoHeight)return null;
    if(native)try {return (await native.detect(video))[0]?.rawValue||null;} catch {native=null;}
    canvas ||= canvasFactory();ctx ||= canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw new Error('CANVAS_UNAVAILABLE');
    const scale=Math.min(1,720/Math.max(video.videoWidth,video.videoHeight));
    canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
    return jsQR(frame.data,frame.width,frame.height,{inversionAttempts:'attemptBoth'})?.data||null;
  };
}

export function createCameraScanner({video,mediaDevices,secure=true,decoder=createQrDecoder,onCode,onStatus=()=>{},onState=()=>{},schedule=setTimeout,cancel=clearTimeout}) {
  let generation=0,stream,timer,state='stopped';
  const change=value=>{state=value;onState(value);};
  const stopTracks=value=>value?.getTracks().forEach(t=>t.stop());
  function stop(){generation++;cancel(timer);timer=null;stopTracks(stream);stream=null;video.pause();video.srcObject=null;video.hidden=true;change('stopped');}
  async function start(){
    stop();const run=generation;change('pending');onStatus('pending');
    try {
      if(!secure)throw Object.assign(new Error(),{name:'INSECURE_CONTEXT'});
      if(!mediaDevices?.getUserMedia)throw Object.assign(new Error(),{name:'CAMERA_NOT_SUPPORTED'});
      const decode=await decoder();if(run!==generation)return;
      const opened=await mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      if(run!==generation){stopTracks(opened);return;}
      stream=opened;video.srcObject=stream;video.hidden=false;video.muted=true;video.playsInline=true;
      await video.play();if(run!==generation)return;
      for(const track of stream.getVideoTracks())track.addEventListener?.('ended',()=>{if(run===generation){stop();onStatus('busy');}},{once:true});
      change('scanning');onStatus('scanning');
      let last='',lastAt=0;
      const scan=async()=>{
        if(run!==generation)return;
        try {
          const code=await decode(video);if(run!==generation)return;
          if(code && (code!==last || Date.now()-lastAt>3000)){
            last=code;lastAt=Date.now();
            try {await onCode(code);if(run===generation)stop();return;}
            catch(error){if(run!==generation)return;onStatus(null,error.message);}
          }
        } catch(error){if(run===generation){stop();onStatus(cameraErrorKey(error));}return;}
        if(run===generation)timer=schedule(scan,160);
      };
      timer=schedule(scan,0);
    }catch(error){if(run===generation){stop();onStatus(cameraErrorKey(error));}}
  }
  return {start,stop,get state(){return state;}};
}
