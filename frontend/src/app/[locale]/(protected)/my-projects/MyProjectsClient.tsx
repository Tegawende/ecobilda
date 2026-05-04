'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Center, Loader } from '@mantine/core';

// Legacy /my-projects → redirect to /my-missions (new dashboard).
export function MyProjectsClient() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/my-missions');
  }, [router]);
  return (
    <Center h="80vh">
      <Loader />
    </Center>
  );
}
