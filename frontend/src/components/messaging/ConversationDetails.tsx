import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Avatar,
  Text,
  Button,
  Group,
  Divider,
  Badge,
  ActionIcon,
  Modal,
} from '@mantine/core';
import {
  IconUser,
  IconMapPin,
  IconCalendar,
  IconStar,
  IconVolume,
  IconVolumeOff,
  IconTrash,
  IconExternalLink,
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { messagingService } from '../../services/messaging';
import type { Conversation, User } from '../../types';
import dayjs from 'dayjs';

interface ConversationDetailsProps {
  conversation: Conversation;
  currentUserId: number;
  onMuteToggle?: () => void;
  onDelete?: () => void;
}

export function ConversationDetails({
  conversation,
  currentUserId,
  onMuteToggle,
  onDelete,
}: ConversationDetailsProps) {
  const navigate = useNavigate();
  const [isTogglingMute, setIsTogglingMute] = useState(false);

  // Determine the other user
  const otherUser =
    currentUserId === conversation.user1.id
      ? conversation.user2
      : conversation.user1;

  const isMuted =
    currentUserId === conversation.user1.id
      ? conversation.user1_muted
      : conversation.user2_muted;

  const handleToggleMute = async () => {
    setIsTogglingMute(true);
    try {
      await messagingService.toggleMute(conversation.id);
      if (onMuteToggle) {
        onMuteToggle();
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    } finally {
      setIsTogglingMute(false);
    }
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: 'Delete conversation',
      children: (
        <Text size="sm">
          Are you sure you want to delete this conversation? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await messagingService.deleteConversation(conversation.id);
          if (onDelete) {
            onDelete();
          }
          navigate('/messages');
        } catch (error) {
          console.error('Failed to delete conversation:', error);
        }
      },
    });
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'white',
        borderLeft: '1px solid #e0e0e0',
      }}
    >
      {/* Header */}
      <Box p="lg" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <Text fw={700} size="lg">
          Details
        </Text>
      </Box>

      {/* Profile Section */}
      <Box p="lg" style={{ textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
        <Stack align="center" gap="md">
          <Avatar
            src={otherUser.profile_picture}
            size={120}
            radius="xl"
            color="blue"
          >
            {!otherUser.profile_picture &&
              `${otherUser.first_name[0]}${otherUser.last_name[0]}`}
          </Avatar>

          <Box>
            <Text fw={700} size="lg">
              {otherUser.first_name} {otherUser.last_name}
            </Text>

            {otherUser.address && (
              <Group justify="center" gap="xs" mt="xs">
                <IconMapPin size={14} color="var(--mantine-color-gray-6)" />
                <Text size="sm" c="dimmed">
                  {otherUser.address.city}
                  {otherUser.address.country && `, ${otherUser.address.country.name}`}
                </Text>
              </Group>
            )}
          </Box>

          <Button
            variant="outline"
            leftSection={<IconUser size={16} />}
            onClick={() => navigate(`/users/${otherUser.id}`)}
            fullWidth
          >
            View full profile
          </Button>
        </Stack>
      </Box>

      {/* User Info Section */}
      <Box p="lg" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <Stack gap="md">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
              About
            </Text>

            {otherUser.bio && (
              <Text size="sm" mb="sm">
                {otherUser.bio}
              </Text>
            )}

            <Stack gap="xs">
              <Group gap="xs">
                <IconCalendar size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" c="dimmed">
                  Member since {dayjs(otherUser.created_at).format('MMM YYYY')}
                </Text>
              </Group>
            </Stack>
          </Box>

          {/* Skills */}
          {otherUser.skills && otherUser.skills.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                Skills
              </Text>
              <Group gap="xs">
                {otherUser.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill.id} variant="light" size="sm">
                    {skill.name}
                  </Badge>
                ))}
                {otherUser.skills.length > 5 && (
                  <Badge variant="light" size="sm" c="dimmed">
                    +{otherUser.skills.length - 5} more
                  </Badge>
                )}
              </Group>
            </Box>
          )}

          {/* Languages */}
          {otherUser.languages && otherUser.languages.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                Languages
              </Text>
              <Group gap="xs">
                {otherUser.languages.map((language) => (
                  <Badge key={language.id} variant="outline" size="sm">
                    {language.name}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Actions Section */}
      <Box p="lg" style={{ marginTop: 'auto' }}>
        <Stack gap="sm">
          <Button
            variant="outline"
            leftSection={
              isMuted ? <IconVolume size={16} /> : <IconVolumeOff size={16} />
            }
            onClick={handleToggleMute}
            loading={isTogglingMute}
            fullWidth
          >
            {isMuted ? 'Unmute conversation' : 'Mute conversation'}
          </Button>

          <Button
            variant="outline"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
            fullWidth
          >
            Delete conversation
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
