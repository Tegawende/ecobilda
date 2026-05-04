'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Center, Loader } from '@mantine/core';

// Legacy /projects/[id] route. Old projects no longer have detail pages — redirect to /missions.
// (A place is now a host container; users browse missions, not places.)
export function ProjectDetailClient() {
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
