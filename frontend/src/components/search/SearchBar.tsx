'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  Paper,
  TextInput,
  Button,
  Group,
  Flex,
  Divider,
  Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import type { DateValue } from '@mantine/dates';

interface SearchParams {
  location: string;
  dateRange: [DateValue, DateValue] | null;
}

export function SearchBar() {
  const t = useTranslations();
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    location: '',
    dateRange: null,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchParams.location) params.set('location', searchParams.location);
    if (searchParams.dateRange && searchParams.dateRange[0]) {
      params.set('start_date', dayjs(searchParams.dateRange[0]).format('YYYY-MM-DD'));
    }
    if (searchParams.dateRange && searchParams.dateRange[1]) {
      params.set('end_date', dayjs(searchParams.dateRange[1]).format('YYYY-MM-DD'));
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSearch}
      shadow="md"
      p={0}
      style={{
        borderRadius: '9999px',
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-gray-3)',
      }}
    >
      <Group gap={0} wrap="nowrap" align="stretch">
        {/* Location Input */}
        <Flex
          direction="column"
          gap={4}
          px="xl"
          py="md"
          style={{ flex: '1 1 55%', minWidth: 220 }}
        >
          <Text size="xs" fw={600} c="dimmed" mb={2}>
            {t('search.location')}
          </Text>
          <TextInput
            placeholder={t('search.whereTo')}
            variant="unstyled"
            value={searchParams.location}
            onChange={(e) => setSearchParams({ ...searchParams, location: e.currentTarget.value })}
            styles={{
              input: {
                fontSize: '14px',
                fontWeight: 500,
                padding: 0,
                minHeight: 'auto',
              },
            }}
          />
        </Flex>

        {/* Divider */}
        <Divider orientation="vertical" color="gray.3" />

        {/* Date Range Input */}
        <Flex
          direction="column"
          gap={4}
          px="xl"
          py="md"
          style={{ flex: '1 1 35%', minWidth: 200 }}
        >
          <Text size="xs" fw={600} c="dimmed" mb={2}>
            {t('search.dates')}
          </Text>
          <DatePickerInput
            type="range"
            placeholder={t('search.addDates')}
            variant="unstyled"
            value={searchParams.dateRange || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, dateRange: value || null })}
            clearable
            styles={{
              input: {
                fontSize: '14px',
                fontWeight: 500,
                padding: 0,
                minHeight: 'auto',
              },
            }}
          />
        </Flex>

        {/* Search Button */}
        <Button
          type="submit"
          size="lg"
          leftSection={<IconSearch size={20} />}
          style={{
            borderRadius: '9999px',
            margin: '6px',
            paddingLeft: '28px',
            paddingRight: '28px',
            flex: '0 0 auto',
            minWidth: 'auto',
            height: 'calc(100% - 12px)',
          }}
        >
          {t('search.search')}
        </Button>
      </Group>
    </Paper>
  );
}
