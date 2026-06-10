import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="archived" options={{ href: null }} />
      <Tabs.Screen name="camera" options={{ href: null }} />
      <Tabs.Screen name="result/[scanId]" options={{ href: null }} />
      <Tabs.Screen name="chat/[scanId]" options={{ href: null }} />
    </Tabs>
  );
}
