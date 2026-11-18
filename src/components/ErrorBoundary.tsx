import React, { type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Tuuduu crashed', error, info);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🤍</Text>
        <Text style={styles.title}>Tuuduu needs a restart</Text>
        <Text style={styles.body}>
          Something unexpected happened. Your saved tasks are still on this device.
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F4F6FC',
  },
  emoji: { fontSize: 34, marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  body: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 19, marginTop: 8 },
  button: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
