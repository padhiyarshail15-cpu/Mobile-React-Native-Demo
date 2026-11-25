import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ExploreScreen from '~/screens/ExploreScreen';
import HomeScreen from '~/screens/HomeScreen';
import PlaceholderScreen from '~/screens/PlaceholderScreen';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        options={{ title: 'Home' }}
        component={HomeScreen}
      />
      <Tab.Screen
        name="Explore"
        options={{ title: 'Explore' }}
        component={ExploreScreen}
      />
      <Tab.Screen name="AskAi" options={{ title: 'Ask AI' }}>
        {() => <PlaceholderScreen title="Ask AI" />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {() => <PlaceholderScreen title="Profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
