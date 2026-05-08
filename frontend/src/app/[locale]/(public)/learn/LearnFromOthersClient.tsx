'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Container,
  Stack,
  Group,
  Text,
  Title,
  Select,
  Grid,
  Center,
  Loader,
} from '@mantine/core';
import { Layout } from '@/components/common/Layout';
import { useCompletedMissionsPublic } from '@/hooks/useConvex';
import { MissionCard } from '@/components/missions/MissionCard';
import {
  POSTE_OPTIONS,
  MISSION_TYPE_OPTIONS,
  TECHNIQUES_BY_POSTE,
  type Poste,
  techniqueI18nKey,
} from '@/types/missions';
import type { Mission } from '@/types';

export function LearnFromOthersClient() {
  const t = useTranslations();
  const [poste, setPoste] = useState<string | null>(null);
  const [technique, setTechnique] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);

  const { missions, isLoading } = useCompletedMissionsPublic({
    poste: poste ?? undefined,
    technique: technique ?? undefined,
    type: type ?? undefined,
  });

  const techOptions = poste
    ? (TECHNIQUES_BY_POSTE[poste as Poste] || []).map((tech) => ({
        value: tech,
        label: t(techniqueI18nKey(tech)),
      }))
    : [];

  return (
    <Layout>
      <Container size="xl" py="md">
        <Stack gap="md">
          <Stack gap={4}>
            <Title order={2}>{t('learn.title')}</Title>
            <Text c="dimmed">{t('learn.subtitle')}</Text>
          </Stack>

          {/* Compact filter row */}
          <Group gap="sm" wrap="wrap">
            <Select
              size="sm"
              placeholder={t('missions.filters.type')}
              data={MISSION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
              value={type}
              onChange={setType}
              clearable
              w={200}
            />
            <Select
              size="sm"
              placeholder={t('missions.filters.poste')}
              data={POSTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
              value={poste}
              onChange={(v) => {
                setPoste(v);
                setTechnique(null);
              }}
              clearable
              w={200}
            />
            <Select
              size="sm"
              placeholder={t('missions.filters.technique')}
              data={techOptions}
              value={technique}
              onChange={setTechnique}
              disabled={!poste || techOptions.length === 0}
              clearable
              w={220}
            />
          </Group>

          {isLoading ? (
            <Center h={300}>
              <Loader />
            </Center>
          ) : missions.length === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <Text c="dimmed">{t('learn.empty')}</Text>
              </Stack>
            </Center>
          ) : (
            <Grid gutter="md">
              {(missions as Mission[]).map((m) => (
                <Grid.Col key={m._id} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
                  <MissionCard
                    mission={m}
                    href={`/learn/${m._id}`}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>
    </Layout>
  );
}
