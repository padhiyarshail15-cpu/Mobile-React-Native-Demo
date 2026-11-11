import { StatusBar, useColorScheme } from 'react-native';

import HomeScreen from '~/screens/HomeScreen';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <HomeScreen />
    </>
  );
}
