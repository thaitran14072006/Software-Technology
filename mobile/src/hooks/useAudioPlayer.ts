import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';
import {ensurePlayer as setup} from '../services/audio/player';
import { resolveAudioUri } from '../services/offline/packService';
import { useLanguageStore } from '../store/languageStore';
import { usePlayback } from '../store/playbackStore';
import type { Poi } from '../services/api/poi.api';
import {useToast} from '../store/toastStore';
import i18n from '../i18n';

const LOCALE: Record<string, string> = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', ko: 'ko-KR' };

export interface AudioApi {
  play: (p: Poi) => Promise<void>; stop: () => Promise<void>; seekFraction: (f: number) => Promise<void>;
  playingId: string | null; isPlaying: boolean; progress: number;
}

export function useAudioPlayer(): AudioApi {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const state = usePlaybackState().state;
  const { position, duration } = useProgress(500);
  const mark = usePlayback((s) => s.markPlayed);
  const usingFile = useRef(false);
  const speechRun = useRef(0);

  const stop = useCallback(async () => {
    speechRun.current++;
    Speech.stop(); setSpeaking(false);
    try{await setup();await TrackPlayer.reset();}catch{}
    setPlayingId(null);
  }, []);

  const speak = useCallback(async (poi: Poi) => {
    const run = ++speechRun.current;
    usingFile.current = false;
    const locale = LOCALE[poi.lang] ?? poi.lang;
    const normalize = (value: string) => value.replaceAll('_', '-').toLowerCase();
    const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
    if (run !== speechRun.current) return;
    const voice = voices.find(v => normalize(v.language) === normalize(locale))
      ?? voices.find(v => normalize(v.language).split('-')[0] === normalize(locale).split('-')[0]);
    if (!voice) {
      setSpeaking(false); setPlayingId(null);
      useToast.getState().show(i18n.t('errors.voiceMissing'));
      return;
    }
    usingFile.current = false; setSpeaking(true);
    Speech.speak(poi.scriptText, { language: locale, voice: voice.identifier, onStart:()=>mark(poi.id), onDone: () => {setSpeaking(false);setPlayingId(null);}, onStopped: () => setSpeaking(false),onError:()=>{setSpeaking(false);setPlayingId(null);} });
  }, [mark]);

  const play = useCallback(async (poi: Poi) => {
    await stop();
    if (poi.translationMissing || poi.lang !== useLanguageStore.getState().lang) { setPlayingId(null); useToast.getState().show(i18n.t('errors.translationMissing')); return; }
    setPlayingId(poi.id);
    const uri = resolveAudioUri(poi.lang, poi.id, poi.audio?.url);
    if (!uri) return speak(poi);
    try {
      usingFile.current = true;
      await setup();
      await TrackPlayer.add({ id: poi.id, url: uri, title: `${poi.code}. ${poi.name}`, artist: 'Nam Cát Tiên' });
      await TrackPlayer.play();
      mark(poi.id);
    } catch { speak(poi); }
  }, [stop, mark, speak]);

  const seekFraction = useCallback(async (f: number) => {
    if (usingFile.current && duration) await TrackPlayer.seekTo(Math.min(1, Math.max(0, f)) * duration);
  }, [duration]);

  useEffect(() => {
    if (usingFile.current && (state === State.Ended || state === State.Stopped)) setPlayingId(null);
  }, [state]);

  const isPlaying = usingFile.current ? state === State.Playing || state === State.Buffering : speaking;
  return { play, stop, seekFraction, playingId, isPlaying, progress: usingFile.current && duration ? position / duration : 0 };
}
