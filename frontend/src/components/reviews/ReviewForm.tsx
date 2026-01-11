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
import type { User } from '../../types';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    initialValues: {
      rating: 0,
      feedback: '',
    },
    validate: {
      rating: (value) => (value >= 1 && value <= 5 ? null : 'Please select a rating'),
      feedback: (value) => {
        if (value.length < 20) return 'Feedback must be at least 20 characters';
        if (value.length > 1000) return 'Feedback must be less than 1000 characters';
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

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Card withBorder shadow="sm" padding="lg">
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <Stack gap="lg">
          <Title order={3}>
            Leave a Review for {receiver.first_name} {receiver.last_name}
          </Title>

          {/* Rating Selection */}
          <div>
            <Text fw={500} mb="xs">
              Rating *
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
            label="Your Feedback *"
            placeholder="Share your experience with this person. What did you appreciate? What could be improved?"
            minRows={5}
            maxLength={1000}
            {...form.getInputProps('feedback')}
            description={`${form.values.feedback.length} / 1000 characters`}
          />

          {/* Guidelines */}
          <Alert color="blue" icon={<IconInfoCircle />} title="Review Guidelines">
            <List size="sm">
              <List.Item>Be honest and constructive</List.Item>
              <List.Item>Focus on your personal experience</List.Item>
              <List.Item>Avoid offensive or discriminatory language</List.Item>
              <List.Item>Reviews are public and cannot be edited once submitted</List.Item>
            </List>
          </Alert>

          {/* Actions */}
          <Group justify="flex-end">
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={<IconStar size={18} />}
            >
              Submit Review
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
