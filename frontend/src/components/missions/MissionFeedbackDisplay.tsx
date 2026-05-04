'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  SimpleGrid,
  Image,
} from '@mantine/core';
import { IconCash, IconRulerMeasure, IconClock, IconAlertCircle, IconBulb } from '@tabler/icons-react';
import { useMissionFeedback, useHelperMissionPhotos } from '@/hooks/useConvex';

interface Props {
  missionId: string;
}

export function MissionFeedbackDisplay({ missionId }: Props) {
  const t = useTranslations();
  const { feedback, isLoading } = useMissionFeedback(missionId);
  const { photos } = useHelperMissionPhotos(missionId, true);

  if (isLoading) return null;
  if (!feedback || !feedback.isPublic) return null;

  return (
    <Card withBorder radius="lg" padding="lg" bg="rgba(112, 167, 113, 0.05)">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={700}>{t('missionFeedback.display.title')}</Text>
          {feedback.result && (
            <Badge
              color={
                feedback.result === 'SUCCESS'
                  ? 'green'
                  : feedback.result === 'PARTIAL_SUCCESS'
                    ? 'yellow'
                    : 'red'
              }
              variant="filled"
              radius="xl"
            >
              {t(`missionFeedback.result.${feedback.result}`)}
            </Badge>
          )}
        </Group>

        <Group gap="lg" wrap="wrap">
          {feedback.totalCostEUR != null && (
            <Group gap={6}>
              <IconCash size={16} />
              <Text size="sm" fw={600}>
                {feedback.totalCostEUR}€
              </Text>
              <Text size="xs" c="dimmed">
                {t('missionFeedback.display.totalCost')}
              </Text>
            </Group>
          )}
          {feedback.surfaceM2 != null && (
            <Group gap={6}>
              <IconRulerMeasure size={16} />
              <Text size="sm" fw={600}>
                {feedback.surfaceM2}m²
              </Text>
              <Text size="xs" c="dimmed">
                {t('missionFeedback.display.surface')}
              </Text>
            </Group>
          )}
          {feedback.actualDurationDays != null && (
            <Group gap={6}>
              <IconClock size={16} />
              <Text size="sm" fw={600}>
                {feedback.actualDurationDays}j
              </Text>
              <Text size="xs" c="dimmed">
                {t('missionFeedback.display.duration')}
              </Text>
            </Group>
          )}
        </Group>

        {feedback.difficultiesText && (
          <Stack gap={4}>
            <Group gap={6}>
              <IconAlertCircle size={16} />
              <Text fw={600} size="sm">
                {t('missionFeedback.display.difficulties')}
              </Text>
            </Group>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {feedback.difficultiesText}
            </Text>
          </Stack>
        )}

        {feedback.learningsText && (
          <Stack gap={4}>
            <Group gap={6}>
              <IconBulb size={16} />
              <Text fw={600} size="sm">
                {t('missionFeedback.display.learnings')}
              </Text>
            </Group>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {feedback.learningsText}
            </Text>
          </Stack>
        )}

        {feedback.photoUrls && feedback.photoUrls.length > 0 && (
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
            {feedback.photoUrls.map((url: string, idx: number) => (
              <Image key={idx} src={url} alt={`feedback ${idx}`} radius="md" />
            ))}
          </SimpleGrid>
        )}

        {photos && photos.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              {t('missionFeedback.display.helperPhotos')}
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
              {photos.map((p: any) => (
                <Stack key={p._id} gap={2}>
                  <Image src={p.url} alt={p.caption ?? ''} radius="md" />
                  {p.caption && (
                    <Text size="xs" c="dimmed">
                      {p.caption}
                    </Text>
                  )}
                  {p.helper && (
                    <Text size="xs" c="dimmed">
                      — {p.helper.firstName}
                    </Text>
                  )}
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
