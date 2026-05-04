'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Center, Loader } from '@mantine/core';

// Legacy /projects route → redirect to /missions (the new bookable units listing).
export function ProjectsPageClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/missions');
  }, [router]);

  return (
    <Center h="80vh">
      <Loader />
    </Center>
  );
}
