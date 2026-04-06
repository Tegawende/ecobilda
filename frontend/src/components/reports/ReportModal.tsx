'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Button, Textarea, Select, Stack, Text, Group } from '@mantine/core';
import { IconFlag } from '@tabler/icons-react';
import { reportsService } from '@/services/reports';
import { notifications } from '@mantine/notifications';

interface ReportModalProps {
  contentType: 'project' | 'review' | 'user';
  objectId: number;
  opened: boolean;
  onClose: () => void;
}

export function ReportModal({ contentType, objectId, opened, onClose }: ReportModalProps) {
  const t = useTranslations();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const reasons = [
    { value: 'spam', label: t('reports.reasons.spam') },
    { value: 'inappropriate', label: t('reports.reasons.inappropriate') },
    { value: 'misleading', label: t('reports.reasons.misleading') },
    { value: 'other', label: t('reports.reasons.other') },
  ];

  const handleSubmit = async () => {
    if (!reason) return;

    setIsLoading(true);
    try {
      await reportsService.createReport({
        contentType: contentType,
        objectId: objectId,
        reason,
        details: details.trim() || undefined,
      });

      notifications.show({
        title: t('reports.submitted'),
        message: t('reports.submittedDesc'),
        color: 'eco-primary',
      });

      setReason('');
      setDetails('');
      onClose();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('reports.submitError'),
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('reports.title')} size="md" radius="lg">
      <Stack gap="md">
        <Select
          label={t('reports.reason')}
          data={reasons}
          value={reason}
          onChange={(v) => setReason(v || '')}
          required
          radius="lg"
        />
        <Textarea
          label={t('reports.details')}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          minRows={3}
          radius="lg"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} radius="xl">{t('common.cancel')}</Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!reason}
            color="red"
            radius="xl"
            leftSection={<IconFlag size={16} />}
          >
            {t('reports.submit')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
