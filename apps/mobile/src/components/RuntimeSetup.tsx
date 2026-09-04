import { StyleSheet, Text, View } from 'react-native';

interface RuntimeSetupProps {
  message: string;
}

export const RuntimeSetup = ({ message }: RuntimeSetupProps) => (
  <View style={styles.container}>
    <Text accessibilityRole="header" style={styles.title}>
      Travel Planner Mobile
    </Text>
    <Text style={styles.status}>Day 1 setup</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#235ba0',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  status: {
    color: '#4a5c70',
    fontSize: 16,
    marginBottom: 16,
  },
  message: {
    color: '#1c2a3a',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 480,
    textAlign: 'center',
  },
});
