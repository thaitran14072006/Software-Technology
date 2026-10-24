import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import './src/services/location/backgroundTask';          // khai báo TaskManager task ở phạm vi module
import App from './src/app/App';

TrackPlayer.registerPlaybackService(() => require('./src/services/audio/playbackService').default);
registerRootComponent(App);
