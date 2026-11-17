import { StyleSheet } from 'react-native';

export function useStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
    },
  });
}
