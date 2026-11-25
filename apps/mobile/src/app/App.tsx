import { StatusBar, useColorScheme } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';

import RootNavigator from '~/navigation/RootNavigator';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}
