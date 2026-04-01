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
    { value: 'spam', label: t('reports.reasons.spam') || 'Spam' },
    { value: 'inappropriate', label: t('reports.reasons.inappropriate') || 'Inappropriate content' },
    { value: 'misleading', label: t('reports.reasons.misleading') || 'Misleading information' },
    { value: 'other', label: t('reports.reasons.other') || 'Other' },
  ];

  const handleSubmit = async () => {
    if (!reason) return;

    setIsLoading(true);
    try {
      await reportsService.createReport({
        content_type: contentType,
        object_id: objectId,
        reason,
        details: details.trim() || undefined,
      });

      notifications.show({
        title: t('reports.submitted') || 'Report submitted',
        message: t('reports.submittedDesc') || 'Thank you for helping us keep the community safe.',
        color: 'eco-primary',
      });

      setReason('');
      setDetails('');
      onClose();
    } catch {
      notifications.show({
        title: t('common.error') || 'Error',
        message: t('reports.submitError') || 'Failed to submit report.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('reports.title') || 'Report'} size="md" radius="lg">
      <Stack gap="md">
        <Select
          label={t('reports.reason') || 'Reason'}
          data={reasons}
          value={reason}
          onChange={(v) => setReason(v || '')}
          required
          radius="lg"
        />
        <Textarea
          label={t('reports.details') || 'Additional details'}
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
            {t('reports.submit') || 'Submit Report'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
