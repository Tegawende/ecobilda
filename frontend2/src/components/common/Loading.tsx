'use client';

import { useTranslations } from 'next-intl';
import { Center, Stack, Loader, Text } from '@mantine/core';

export function Loading() {
  const t = useTranslations();

  return (
    <Center mih="100vh">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">{t('common.loading')}</Text>
      </Stack>
    </Center>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const;

  return <Loader size={sizeMap[size]} />;
}
