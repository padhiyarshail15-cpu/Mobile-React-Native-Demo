import { Text } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useStyles } from './PlaceholderScreen.styles';

type PlaceholderScreenProps = {
  title: string;
};

export default function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title} testID="placeholder-title">
        {title}
      </Text>
    </SafeAreaView>
  );
}
