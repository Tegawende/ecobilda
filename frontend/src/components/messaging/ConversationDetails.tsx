'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { getSkillIcon } from '@/lib/skillIcons';
import { getSkillDisplayName } from '@/types';
import {
  Box,
  Stack,
  Avatar,
  Text,
  Button,
  Group,
  Badge,
} from '@mantine/core';
import {
  IconMapPin,
  IconCalendar,
  IconVolume,
  IconVolumeOff,
  IconTrash,
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { messagingService } from '@/services/messaging';
import type { Conversation } from '@/types';
import dayjs from 'dayjs';

interface ConversationDetailsProps {
  conversation: Conversation;
  currentUserId: string;
  onMuteToggle?: () => void;
  onDelete?: () => void;
}

export function ConversationDetails({
  conversation,
  currentUserId,
  onMuteToggle,
  onDelete,
}: ConversationDetailsProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [isTogglingMute, setIsTogglingMute] = useState(false);

  // Determine the other user
  const otherUser = conversation.otherUser;

  const isMuted = conversation.isMuted ?? false;

  const handleToggleMute = async () => {
    setIsTogglingMute(true);
    try {
      await messagingService.toggleMute(conversation._id);
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
      title: t('messaging.deleteConfirm'),
      children: (
        <Text size="sm">
          {t('messaging.deleteConfirmText')}
        </Text>
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await messagingService.deleteConversation(conversation._id);
          if (onDelete) {
            onDelete();
          }
          router.push('/messages');
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
          {t('messaging.details')}
        </Text>
      </Box>

      {/* Profile Section */}
      <Box p="lg" style={{ textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
        <Stack align="center" gap="md">
          <Avatar
            src={otherUser?.profilePictureUrl || otherUser?.profilePicture}
            size={120}
            radius="xl"
            color="blue"
          >
            {!otherUser?.profilePicture &&
              `${otherUser?.firstName?.[0] ?? ''}${otherUser?.lastName?.[0] ?? ''}`}
          </Avatar>

          <Box>
            <Text fw={700} size="lg">
              {otherUser?.firstName} {otherUser?.lastName}
            </Text>

            {(otherUser as any)?.address && (
              <Group justify="center" gap="xs" mt="xs">
                <IconMapPin size={14} color="var(--mantine-color-gray-6)" />
                <Text size="sm" c="dimmed">
                  {(otherUser as any).address.city}
                  {(otherUser as any).address.country && `, ${(otherUser as any).address.country.name}`}
                </Text>
              </Group>
            )}
          </Box>

          <Button
            variant="outline"
            onClick={() => router.push(`/profile/${otherUser?._id}`)}
            fullWidth
          >
            {t('messaging.viewFullProfile')}
          </Button>
        </Stack>
      </Box>

      {/* User Info Section */}
      <Box p="lg" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <Stack gap="md">
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
              {t('messaging.about')}
            </Text>

            {(otherUser as any)?.bio && (
              <Text size="sm" mb="sm">
                {(otherUser as any).bio}
              </Text>
            )}

            <Stack gap="xs">
              <Group gap="xs">
                <IconCalendar size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" c="dimmed">
                  {t('messaging.memberSince', { date: dayjs().format('MMM YYYY') })}
                </Text>
              </Group>
            </Stack>
          </Box>

          {/* Skills */}
          {(otherUser as any)?.skills && (otherUser as any).skills.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                {t('messaging.skills')}
              </Text>
              <Group gap="xs">
                {(otherUser as any).skills.slice(0, 5).map((skill: any, index: number) => {
                  const SkillIcon = getSkillIcon(skill.icon);
                  return (
                    <Badge key={skill.code || index} variant="light" size="sm" leftSection={<SkillIcon size={12} />}>
                      {getSkillDisplayName(skill, locale)}
                    </Badge>
                  );
                })}
                {(otherUser as any).skills.length > 5 && (
                  <Badge variant="light" size="sm" c="dimmed">
                    {t('messaging.more', { count: (otherUser as any).skills.length - 5 })}
                  </Badge>
                )}
              </Group>
            </Box>
          )}

          {/* Languages */}
          {(otherUser as any)?.languages && (otherUser as any).languages.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                {t('messaging.languages')}
              </Text>
              <Group gap="xs">
                {(otherUser as any).languages.map((language: any, index: number) => (
                  <Badge key={language.code || index} variant="outline" size="sm">
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
            {isMuted ? t('messaging.unmuteConversation') : t('messaging.muteConversation')}
          </Button>

          <Button
            variant="outline"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
            fullWidth
          >
            {t('messaging.deleteConversation')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
