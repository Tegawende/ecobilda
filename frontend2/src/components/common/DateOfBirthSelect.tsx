'use client';

import { useTranslations } from 'next-intl';
import { NativeSelect, SimpleGrid, Stack, Text, Group } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

/** Returns max days for a given month (1-12) and year */
function getDaysInMonth(month: number, year: number): number {
  if (!month || month < 1 || month > 12) return 31;
  if (!year || year < 1900) return 31;
  return new Date(year, month, 0).getDate();
}

export interface DateOfBirthValues {
  dob_day: string;
  dob_month: string;
  dob_year: string;
}

interface DateOfBirthSelectProps {
  values: DateOfBirthValues;
  onChange: (field: keyof DateOfBirthValues, value: string) => void;
  error?: string | null;
  /** 'auth' for the auth form style (plain selects), 'profile' for Mantine style */
  variant?: 'auth' | 'profile';
}

const currentYear = new Date().getFullYear();
const maxYear = currentYear - 18;
const minYear = currentYear - 100;

const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

export function DateOfBirthSelect({ values, onChange, error, variant = 'auth' }: DateOfBirthSelectProps) {
  const t = useTranslations();
  const months: string[] = t.raw('auth.dobMonths');

  // Compute max days based on selected month/year
  const month = parseInt(values.dob_month, 10);
  const year = parseInt(values.dob_year, 10);
  const maxDays = getDaysInMonth(month || 0, year || 0);
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Auto-correct day if it exceeds max days for the selected month/year
  const selectedDay = parseInt(values.dob_day, 10);
  if (values.dob_day && selectedDay > maxDays) {
    onChange('dob_day', '');
  }

  const displayError = error;

  const selectSize = variant === 'auth' ? 'md' : 'sm';
  const selectRadius = variant === 'auth' ? 'md' : 'sm';

  return (
    <Stack gap={6}>
      <Text
        size={variant === 'auth' ? 'xs' : 'sm'}
        fw={variant === 'auth' ? 700 : 500}
        c={variant === 'auth' ? 'dimmed' : 'dark'}
        ml={variant === 'auth' ? 4 : 0}
      >
        {t('auth.dateOfBirth')}
      </Text>

      <SimpleGrid cols={3} spacing="xs">
        {/* Day */}
        <NativeSelect
          value={values.dob_day}
          onChange={(e) => onChange('dob_day', e.target.value)}
          size={selectSize}
          radius={selectRadius}
          error={!!displayError}
          data={[
            { value: '', label: t('auth.dobDay') },
            ...dayOptions.map((d) => ({ value: String(d), label: String(d) })),
          ]}
        />

        {/* Month */}
        <NativeSelect
          value={values.dob_month}
          onChange={(e) => onChange('dob_month', e.target.value)}
          size={selectSize}
          radius={selectRadius}
          error={!!displayError}
          data={[
            { value: '', label: t('auth.dobMonth') },
            ...months.map((name, i) => ({ value: String(i + 1), label: name })),
          ]}
        />

        {/* Year */}
        <NativeSelect
          value={values.dob_year}
          onChange={(e) => onChange('dob_year', e.target.value)}
          size={selectSize}
          radius={selectRadius}
          error={!!displayError}
          data={[
            { value: '', label: t('auth.dobYear') },
            ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
          ]}
        />
      </SimpleGrid>

      {displayError && (
        <Group gap={4} mt={4} ml={4}>
          <IconAlertCircle size={12} color="var(--mantine-color-red-6)" />
          <Text size="xs" c="red">{displayError}</Text>
        </Group>
      )}

      {variant === 'auth' && (
        <Text size="xs" c="dimmed" ml={4}>{t('auth.dobDesc')}</Text>
      )}
    </Stack>
  );
}

/** Validation helper for forms */
export function validateDateOfBirth(day: string, month: string, year: string, t: (key: string) => string): string | null {
  if (!day || !month || !year) return t('auth.validation.birthDateRequired');
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (d > getDaysInMonth(m, y)) return t('auth.dobInvalidDate');
  const today = new Date();
  const birthDate = new Date(y, m - 1, d);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  const exactAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  if (exactAge < 18) return t('auth.validation.ageRequirement');
  return null;
}
