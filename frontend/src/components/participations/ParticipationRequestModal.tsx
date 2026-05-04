'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Button, Textarea, TextInput, Stack, Text, Group } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconSend } from '@tabler/icons-react';
import { participationsService } from '@/services/participations';
import { notifications } from '@mantine/notifications';

interface ParticipationRequestModalProps {
  missionId: string;
  missionTitle: string;
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ParticipationRequestModal({
  missionId,
  missionTitle,
  opened,
  onClose,
  onSuccess,
}: ParticipationRequestModalProps) {
  const t = useTranslations();
  const [motivation, setMotivation] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!motivation.trim()) return;

    setIsLoading(true);
    try {
      await participationsService.createRequest({
        missionId,
        motivation: motivation.trim(),
        proposedStartDate: startDate?.toISOString().split('T')[0],
        proposedEndDate: endDate?.toISOString().split('T')[0],
      });

      notifications.show({
        title: t('participations.requestSent'),
        message: t('participations.requestSentDesc'),
        color: 'eco-primary',
      });

      setMotivation('');
      setStartDate(null);
      setEndDate(null);
      onClose();
      onSuccess?.();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('participations.requestError'),
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('participations.applyTitle')}
      size="lg"
      radius="lg"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('participations.applyDesc')}
        </Text>
        <Text size="sm" fw={600}>{missionTitle}</Text>

        <Textarea
          label={t('participations.motivation')}
          placeholder={t('participations.motivationPlaceholder')}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          minRows={4}
          maxRows={8}
          required
          radius="lg"
        />

        <Group grow>
          <DateInput
            label={t('participations.startDate')}
            value={startDate}
            onChange={setStartDate}
            radius="lg"
            clearable
          />
          <DateInput
            label={t('participations.endDate')}
            value={endDate}
            onChange={setEndDate}
            radius="lg"
            clearable
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} radius="xl">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!motivation.trim()}
            color="eco-primary"
            radius="xl"
            leftSection={<IconSend size={16} />}
          >
            {t('participations.sendRequest')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
