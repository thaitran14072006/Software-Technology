import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../../screens/Splash/SplashScreen';
import MapScreen from '../../screens/Map/MapScreen';
import QrScannerScreen from '../../screens/QrScanner/QrScannerScreen';
import OfflineScreen from '../../screens/Offline/OfflineScreen';

export type RootStack = { Splash: undefined; Map: undefined; QrScanner: undefined; Offline: undefined };
const Stack = createNativeStackNavigator<RootStack>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      {/* Splash luôn hiển thị (yêu cầu): mỗi lần mở app chọn/xác nhận ngôn ngữ trước khi vào bản đồ */}
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="QrScanner" component={QrScannerScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="Offline" component={OfflineScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
