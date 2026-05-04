'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Center, Loader } from '@mantine/core';

// Legacy /search route → redirect to /missions with the keyword preserved.
export function SearchResultsClient() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const keyword = params.get('keyword') || params.get('q') || '';
    const target = keyword ? `/missions?keyword=${encodeURIComponent(keyword)}` : '/missions';
    router.replace(target as any);
  }, [router, params]);

  return (
    <Center h="80vh">
      <Loader />
    </Center>
  );
}
