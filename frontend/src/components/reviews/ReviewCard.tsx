import { useState } from 'react';
import {
  Paper,
  Group,
  Avatar,
  Text,
  Rating,
  Button,
  Textarea,
  Box,
} from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import type { Review, User } from '../../types';

interface ReviewCardProps {
  review: Review;
  currentUser?: User;
  onResponseSubmit?: (reviewId: number, response: string) => Promise<void>;
}

export function ReviewCard({ review, currentUser, onResponseSubmit }: ReviewCardProps) {
  const [isRespondingMode, setIsRespondingMode] = useState(false);
  const [responseText, setResponseText] = useState(review.response || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canRespond =
    currentUser &&
    currentUser.id === review.receiver.id &&
    !review.response &&
    onResponseSubmit;

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || !onResponseSubmit) return;

    setIsSubmitting(true);
    try {
      await onResponseSubmit(review.id, responseText.trim());
      setIsRespondingMode(false);
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      {/* Review Header */}
      <Group justify="space-between" mb="md">
        <Group>
          <Avatar
            src={review.writer.profile_picture}
            size="md"
            radius="xl"
            color="blue"
          >
            {!review.writer.profile_picture &&
              `${review.writer.first_name[0]}${review.writer.last_name[0]}`}
          </Avatar>
          <Box>
            <Text fw={600}>
              {review.writer.first_name} {review.writer.last_name}
            </Text>
            <Text size="sm" c="dimmed">{formatDate(review.created_at)}</Text>
          </Box>
        </Group>

        <Group gap="xs">
          <Rating value={review.rating} readOnly />
          <Text size="sm" fw={500}>{review.rating}.0</Text>
        </Group>
      </Group>

      {/* Review Feedback */}
      <Text mb="md" style={{ whiteSpace: 'pre-wrap' }}>{review.feedback}</Text>

      {/* Response Section */}
      {review.response && (
        <Box mt="md" pt="md" px="md" pb="md" bg="gray.0" style={{ borderRadius: 8, marginLeft: -16, marginRight: -16, marginBottom: -16 }}>
          <Group gap="xs" mb="xs">
            <Text size="sm" fw={600}>Response from {review.receiver.first_name}:</Text>
            {review.response_date && (
              <Text size="xs" c="dimmed">{formatDate(review.response_date)}</Text>
            )}
          </Group>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{review.response}</Text>
        </Box>
      )}

      {/* Respond Button/Form */}
      {canRespond && !isRespondingMode && (
        <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button
            variant="subtle"
            leftSection={<IconMessageCircle size={16} />}
            onClick={() => setIsRespondingMode(true)}
          >
            Respond to this review
          </Button>
        </Box>
      )}

      {isRespondingMode && (
        <Box
          component="form"
          onSubmit={handleSubmitResponse}
          mt="md"
          pt="md"
          style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
        >
          <Textarea
            label="Your Response"
            value={responseText}
            onChange={(e) => setResponseText(e.currentTarget.value)}
            placeholder="Write your response..."
            minRows={3}
            required
            mb="md"
          />
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                setIsRespondingMode(false);
                setResponseText(review.response || '');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!responseText.trim() || isSubmitting}
              loading={isSubmitting}
            >
              Submit Response
            </Button>
          </Group>
        </Box>
      )}
    </Paper>
  );
}
