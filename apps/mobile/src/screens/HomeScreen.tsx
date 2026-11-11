import { Alert, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@repo/ui';
import { env } from '~/config/env';

export default function HomeScreen() {
  const abc: string = 'null';
  console.log(abc);
  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'right', 'bottom', 'left']}>
      <Text style={styles.envLabel} testID="env-label">
        {`Loaded env: ${env.appEnv}`}
      </Text>
      <View style={styles.footer}>
        <Button
          title="Press me please"
          onPress={() => Alert.alert('Button pressed')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  envLabel: {
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
