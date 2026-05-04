'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Group,
  Text,
  Title,
  Select,
  Grid,
  Card,
  Badge,
  Center,
  Loader,
  Image,
  Box,
} from '@mantine/core';
import { IconCalendar, IconCash, IconBulb, IconAlertCircle } from '@tabler/icons-react';
import { useCompletedMissionsPublic } from '@/hooks/useConvex';
import { POSTE_OPTIONS, MISSION_TYPE_OPTIONS, TECHNIQUES_BY_POSTE, type Poste, techniqueI18nKey } from '@/types/missions';

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
    <Container size="xl" py="md">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={1}>{t('learn.title')}</Title>
          <Text c="dimmed" size="lg">
            {t('learn.subtitle')}
          </Text>
        </Stack>

        <Card withBorder radius="md" padding="md">
          <Group grow>
            <Select
              label={t('missions.filters.type')}
              placeholder={t('common.any')}
              data={MISSION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
              value={type}
              onChange={setType}
              clearable
            />
            <Select
              label={t('missions.filters.poste')}
              placeholder={t('common.any')}
              data={POSTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
              value={poste}
              onChange={(v) => {
                setPoste(v);
                setTechnique(null);
              }}
              clearable
            />
            <Select
              label={t('missions.filters.technique')}
              placeholder={t('common.any')}
              data={techOptions}
              value={technique}
              onChange={setTechnique}
              disabled={!poste || techOptions.length === 0}
              clearable
            />
          </Group>
        </Card>

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
            {missions.map((m: any) => {
              const fb = m.feedback;
              const cover =
                m.coverImageUrl ||
                m.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
              return (
                <Grid.Col key={m._id} span={{ base: 12, sm: 6, lg: 4 }}>
                  <Card
                    component={Link as any}
                    href={`/missions/${m._id}`}
                    withBorder
                    radius="lg"
                    padding={0}
                    style={{ textDecoration: 'none', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <Box style={{ position: 'relative', aspectRatio: '4 / 3' }}>
                      <Image src={cover} alt={m.title} h="100%" fit="cover" />
                      <Group gap={4} style={{ position: 'absolute', top: 8, left: 8 }}>
                        {m.poste && (
                          <Badge size="xs" variant="filled" color="eco-primary" radius="xl">
                            {t(`missions.poste.${m.poste}`)}
                          </Badge>
                        )}
                        {m.technique && (
                          <Badge size="xs" variant="filled" color="dark" radius="xl">
                            {t(`missions.technique.${m.technique}`)}
                          </Badge>
                        )}
                      </Group>
                      {fb?.result && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color={
                            fb.result === 'SUCCESS'
                              ? 'green'
                              : fb.result === 'PARTIAL_SUCCESS'
                                ? 'yellow'
                                : 'red'
                          }
                          radius="xl"
                          style={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          {t(`missionFeedback.result.${fb.result}`)}
                        </Badge>
                      )}
                    </Box>

                    <Stack gap="xs" p="md">
                      <Text fw={700} size="md" lineClamp={2}>
                        {m.title}
                      </Text>
                      <Group gap={4}>
                        <IconCalendar size={12} />
                        <Text size="xs" c="dimmed">
                          {fb?.actualDurationDays
                            ? `${fb.actualDurationDays}j`
                            : `${m.startDate} → ${m.endDate}`}
                        </Text>
                      </Group>

                      <Group gap="md">
                        {fb?.totalCostEUR != null && (
                          <Group gap={4}>
                            <IconCash size={12} />
                            <Text size="xs" fw={600}>
                              {fb.totalCostEUR}€
                            </Text>
                          </Group>
                        )}
                        {fb?.surfaceM2 != null && (
                          <Text size="xs" c="dimmed">
                            {fb.surfaceM2}m²
                          </Text>
                        )}
                      </Group>

                      {fb?.learningsText && (
                        <Group gap={6} wrap="nowrap" align="flex-start">
                          <IconBulb size={14} style={{ marginTop: 3, flexShrink: 0 }} />
                          <Text size="xs" c="dimmed" lineClamp={3}>
                            {fb.learningsText}
                          </Text>
                        </Group>
                      )}
                      {fb?.difficultiesText && (
                        <Group gap={6} wrap="nowrap" align="flex-start">
                          <IconAlertCircle size={14} style={{ marginTop: 3, flexShrink: 0 }} />
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {fb.difficultiesText}
                          </Text>
                        </Group>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
