'use client';

import { useTranslations } from 'next-intl';
import {
  Stack,
  TextInput,
  Select,
  Group,
  Switch,
  Button,
  Badge,
  ScrollArea,
  Box,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  MISSION_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  POSTE_OPTIONS,
  TECHNIQUES_BY_POSTE,
  type Poste,
  techniqueI18nKey,
} from '@/types/missions';
import { useSkills, useLanguages } from '@/hooks/useConvex';

export interface MissionFiltersState {
  keyword: string;
  type?: 'CHANTIER' | 'FORMATION';
  difficulty?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  poste?: string;
  technique?: string;
  pricingMode?: 'FREE' | 'PAID';
  skills: string[];
  countries: string[];
  languages: string[];
  startsAfter?: string;
  endsBefore?: string;
}

export const initialMissionFilters: MissionFiltersState = {
  keyword: '',
  skills: [],
  countries: [],
  languages: [],
};

interface MissionFiltersProps {
  filters: MissionFiltersState;
  onChange: (next: MissionFiltersState) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

export function MissionFilters({ filters, onChange, onReset, isLoading }: MissionFiltersProps) {
  const t = useTranslations();
  const { skills } = useSkills();
  const { languages } = useLanguages();

  const update = (patch: Partial<MissionFiltersState>) => onChange({ ...filters, ...patch });

  const techOptions: { value: string; label: string }[] = filters.poste
    ? (TECHNIQUES_BY_POSTE[filters.poste as Poste] || []).map((tech) => ({
        value: tech,
        label: t(techniqueI18nKey(tech)),
      }))
    : [];

  const activeCount =
    (filters.keyword ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.difficulty ? 1 : 0) +
    (filters.poste ? 1 : 0) +
    (filters.technique ? 1 : 0) +
    (filters.pricingMode ? 1 : 0) +
    filters.skills.length +
    filters.countries.length +
    filters.languages.length +
    (filters.startsAfter ? 1 : 0) +
    (filters.endsBefore ? 1 : 0);

  return (
    <Box>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            {t('missions.filters.title')}
            {activeCount > 0 && (
              <Badge color="eco-primary" variant="filled" size="sm" radius="xl">
                {activeCount}
              </Badge>
            )}
          </Group>
          {onReset && activeCount > 0 && (
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconX size={14} />}
              onClick={onReset}
              color="gray"
            >
              {t('common.reset')}
            </Button>
          )}
        </Group>

        <TextInput
          placeholder={t('missions.filters.keywordPlaceholder')}
          value={filters.keyword}
          onChange={(e) => update({ keyword: e.target.value })}
          leftSection={<IconSearch size={16} />}
          radius="md"
          disabled={isLoading}
        />

        <Group grow>
          <Select
            label={t('missions.filters.type')}
            placeholder={t('common.any')}
            value={filters.type ?? null}
            onChange={(v) => update({ type: (v ?? undefined) as any })}
            data={MISSION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
            clearable
            radius="md"
          />
          <Select
            label={t('missions.filters.difficulty')}
            placeholder={t('common.any')}
            value={filters.difficulty ?? null}
            onChange={(v) => update({ difficulty: (v ?? undefined) as any })}
            data={DIFFICULTY_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
            clearable
            radius="md"
          />
        </Group>

        <Group grow>
          <Select
            label={t('missions.filters.poste')}
            placeholder={t('common.any')}
            value={filters.poste ?? null}
            onChange={(v) => update({ poste: v ?? undefined, technique: undefined })}
            data={POSTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
            clearable
            radius="md"
          />
          <Select
            label={t('missions.filters.technique')}
            placeholder={t('common.any')}
            value={filters.technique ?? null}
            onChange={(v) => update({ technique: v ?? undefined })}
            data={techOptions}
            disabled={!filters.poste || techOptions.length === 0}
            clearable
            radius="md"
          />
        </Group>

        <Group grow>
          <DateInput
            label={t('missions.filters.startsAfter')}
            value={filters.startsAfter ? new Date(filters.startsAfter) : null}
            onChange={(d) =>
              update({ startsAfter: d ? new Date(d).toISOString().split('T')[0] : undefined })
            }
            clearable
            radius="md"
          />
          <DateInput
            label={t('missions.filters.endsBefore')}
            value={filters.endsBefore ? new Date(filters.endsBefore) : null}
            onChange={(d) =>
              update({ endsBefore: d ? new Date(d).toISOString().split('T')[0] : undefined })
            }
            clearable
            radius="md"
          />
        </Group>

        <Switch
          label={t('missions.filters.freeOnly')}
          checked={filters.pricingMode === 'FREE'}
          onChange={(e) => update({ pricingMode: e.currentTarget.checked ? 'FREE' : undefined })}
        />

        <ScrollArea h={140} type="auto">
          <Stack gap={4}>
            <Box style={{ fontWeight: 600, fontSize: 13 }}>{t('missions.filters.skills')}</Box>
            <Group gap={6}>
              {skills.map((skill: any) => {
                const checked = filters.skills.includes(skill.code);
                return (
                  <Badge
                    key={skill.code}
                    variant={checked ? 'filled' : 'light'}
                    color="eco-primary"
                    radius="xl"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      update({
                        skills: checked
                          ? filters.skills.filter((s) => s !== skill.code)
                          : [...filters.skills, skill.code],
                      })
                    }
                  >
                    {skill.displayNameFr || skill.displayNameEn}
                  </Badge>
                );
              })}
            </Group>
          </Stack>
        </ScrollArea>

        <ScrollArea h={120} type="auto">
          <Stack gap={4}>
            <Box style={{ fontWeight: 600, fontSize: 13 }}>{t('missions.filters.languages')}</Box>
            <Group gap={6}>
              {languages.slice(0, 12).map((lang: any) => {
                const checked = filters.languages.includes(lang.code);
                return (
                  <Badge
                    key={lang.code}
                    variant={checked ? 'filled' : 'light'}
                    color="dark"
                    radius="xl"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      update({
                        languages: checked
                          ? filters.languages.filter((l) => l !== lang.code)
                          : [...filters.languages, lang.code],
                      })
                    }
                  >
                    {lang.name}
                  </Badge>
                );
              })}
            </Group>
          </Stack>
        </ScrollArea>
      </Stack>
    </Box>
  );
}
