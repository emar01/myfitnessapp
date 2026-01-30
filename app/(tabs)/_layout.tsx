import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/DesignSystem';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

import DesktopSidebar from '@/components/DesktopSidebar';
import { useWindowDimensions, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <DesktopSidebar />
        <View style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Palette.primary.main,
              tabBarInactiveTintColor: Palette.text.disabled,
              headerShown: false,
              tabBarStyle: { display: 'none' }, // Always hide bottom tabs on desktop
            }}>
            <Tabs.Screen name="index" options={{ href: null }} />
            <Tabs.Screen name="library" options={{ href: null }} />
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="calendar" options={{ href: null }} />
            <Tabs.Screen name="coach" options={{ href: null }} />
            <Tabs.Screen name="two" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.primary.main,
        tabBarInactiveTintColor: Palette.text.disabled,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 5,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hem',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliotek',
          tabBarIcon: ({ color }) => <FontAwesome name="book" size={24} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Inställningar',
          tabBarIcon: ({ color }) => <FontAwesome name="cog" size={24} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={22} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color }) => <FontAwesome name="magic" size={22} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null, // Hide tab two
        }}
      />
    </Tabs>
  );
}
