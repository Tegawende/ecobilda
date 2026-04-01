'use client';

import { useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Card,
  Title,
  Text,
  Textarea,
  Button,
  Group,
  Stack,
  Rating,
  Alert,
  List,
} from '@mantine/core';
import { IconInfoCircle, IconStar } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { User } from '@/types';

interface ReviewFormData {
  rating: number;
  feedback: string;
}

interface ReviewFormProps {
  receiver: User;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel: () => void;
}

export function ReviewForm({ receiver, onSubmit, onCancel }: ReviewFormProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    initialValues: {
      rating: 0,
      feedback: '',
    },
    validate: {
      rating: (value) => (value >= 1 && value <= 5 ? null : t('reviews.ratingRequired')),
      feedback: (value) => {
        if (value.length < 20) return t('reviews.feedbackMinLength');
        if (value.length > 1000) return t('reviews.feedbackMaxLength');
        return null;
      },
    },
  });

  const handleFormSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = [t('reviews.ratingPoor'), t('reviews.ratingFair'), t('reviews.ratingGood'), t('reviews.ratingVeryGood'), t('reviews.ratingExcellent')];

  return (
    <Card withBorder shadow="sm" padding="lg">
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <Stack gap="lg">
          <Title order={3}>
            {t('reviews.leaveReview', { firstName: receiver.first_name, lastName: receiver.last_name })}
          </Title>

          {/* Rating Selection */}
          <div>
            <Text fw={500} mb="xs">
              {t('reviews.ratingLabel')}
            </Text>
            <Group>
              <Rating
                size="xl"
                value={form.values.rating}
                onChange={(value) => form.setFieldValue('rating', value)}
                count={5}
              />
              {form.values.rating > 0 && (
                <Text size="sm" fw={500}>
                  {ratingLabels[form.values.rating - 1]}
                </Text>
              )}
            </Group>
            {form.errors.rating && (
              <Text size="sm" c="red" mt="xs">
                {form.errors.rating}
              </Text>
            )}
          </div>

          {/* Feedback Textarea */}
          <Textarea
            label={t('reviews.feedbackLabel')}
            placeholder={t('reviews.feedbackPlaceholder')}
            minRows={5}
            maxLength={1000}
            {...form.getInputProps('feedback')}
            description={`${form.values.feedback.length} / 1000 characters`}
          />

          {/* Guidelines */}
          <Alert color="blue" icon={<IconInfoCircle />} title={t('reviews.guidelines')}>
            <List size="sm">
              <List.Item>{t('reviews.guidelineHonest')}</List.Item>
              <List.Item>{t('reviews.guidelinePersonal')}</List.Item>
              <List.Item>{t('reviews.guidelineRespectful')}</List.Item>
              <List.Item>{t('reviews.guidelinePublic')}</List.Item>
            </List>
          </Alert>

          {/* Actions */}
          <Group justify="flex-end">
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={<IconStar size={18} />}
            >
              {t('reviews.submitReview')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
