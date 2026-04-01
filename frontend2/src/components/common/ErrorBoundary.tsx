'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Button, Center, Stack, Text, Title, Paper, Group, Code, Box } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Center mih="100vh" className="bg-eco-cream" px="lg">
          <Stack align="center" maw={450} w="100%">
            <Box className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <IconAlertTriangle size={40} className="text-red-500" strokeWidth={1.5} />
            </Box>

            <Title order={2} ta="center">
              Something went wrong
            </Title>

            <Text c="dimmed" ta="center">
              An unexpected error occurred. We apologize for the inconvenience.
            </Text>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Paper p="md" radius="md" bg="red.0" w="100%" style={{ overflow: 'auto', maxHeight: 192 }}>
                <Code block color="red">
                  {this.state.error.toString()}
                </Code>
                {this.state.errorInfo && (
                  <Code block color="red" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo.componentStack}
                  </Code>
                )}
              </Paper>
            )}

            <Group gap="sm" mt="md">
              <Button
                onClick={this.handleRetry}
                leftSection={<IconRefresh size={18} />}
                radius="xl"
                size="md"
                className="bg-eco-primary hover:bg-eco-primaryDark transition-all"
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                leftSection={<IconHome size={18} />}
                variant="outline"
                radius="xl"
                size="md"
                color="gray"
                className="hover:border-eco-primary hover:text-eco-primary transition-all"
              >
                Go Home
              </Button>
            </Group>
          </Stack>
        </Center>
      );
    }

    return this.props.children;
  }
}
