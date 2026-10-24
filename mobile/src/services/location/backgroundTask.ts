import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useLocationStore } from '../../store/locationStore';
import {AppState} from 'react-native';
import TrackPlayer,{State} from 'react-native-track-player';
import * as FS from 'expo-file-system/legacy';
import {ensurePlayer} from '../audio/player';
import {usePlayback} from '../../store/playbackStore';
import {useLanguageStore} from '../../store/languageStore';
import {loadPack} from '../offline/offlineStore';
import {runtimeConfig} from '../api/runtimeConfig';
import {GeofenceEngine} from '../../utils/geofence';

export const BG_TASK = 'sag-bg-location';
const engine=new GeofenceEngine();let playing=false;

// Phải khai báo ở phạm vi module (index.ts import file này trước khi render App)
TaskManager.defineTask(BG_TASK, async ({ data, error }: any) => {
  if (error) return;
  const last = (data?.locations as Location.LocationObject[] | undefined)?.at(-1);
  if(!last)return;
  const fix={lat:last.coords.latitude,lng:last.coords.longitude,accuracy:last.coords.accuracy};
  useLocationStore.getState().setFix(fix);
  // No React hook is needed while backgrounded. Only downloaded MP3s are used here.
  if(AppState.currentState==='active'||!usePlayback.getState().auto||playing)return;
  const pack=loadPack(useLanguageStore.getState().lang);if(!pack)return;
  const points=Object.values(pack.items).filter(p=>p.geoVerified).map(p=>({id:p.id,lat:p.lat,lng:p.lng,radiusM:p.triggerRadiusM??runtimeConfig().default_trigger_radius_m}));
  const event=engine.update(fix,points)[0];if(!event)return;
  const poi=pack.items[event.poi.id],uri=pack.files[poi.id];
  if(!uri||!usePlayback.getState().canAutoPlay(poi.id,runtimeConfig().replay_audio_cooldown_min))return;
  playing=true;
  try{
    if(!(await FS.getInfoAsync(uri)).exists)return;
    const state=(await TrackPlayer.getPlaybackState()).state;if(state===State.Playing||state===State.Buffering)return;
    await TrackPlayer.reset();await TrackPlayer.add({id:poi.id,url:uri,title:poi.name,artist:'Nam Cát Tiên'});await TrackPlayer.play();usePlayback.getState().markPlayed(poi.id);
  }catch{/* Native OS lifecycle behavior must be checked on the target device. */}finally{playing=false;}
});

export async function startBackground(): Promise<boolean> {
  await ensurePlayer();
  const bg = await Location.requestBackgroundPermissionsAsync();        // Android 11+: bước riêng, có thể mở Cài đặt
  if (bg.status !== 'granted') return false;
  if (await Location.hasStartedLocationUpdatesAsync(BG_TASK)) return true;
  await Location.startLocationUpdatesAsync(BG_TASK, {
    accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 3,
    pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
    foregroundService: { notificationTitle: 'Cát Tiên Audio Guide', notificationBody: 'Đang theo dõi vị trí để phát thuyết minh', notificationColor: '#e8c58f' },
  });
  return true;
}

export async function stopBackground() {
  if (await Location.hasStartedLocationUpdatesAsync(BG_TASK)) await Location.stopLocationUpdatesAsync(BG_TASK);
}
