'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Box, Stack, Avatar, Text, Button, Group, Badge, ScrollArea, Divider,
} from '@mantine/core';
import {
  IconMapPin, IconCalendar, IconVolume, IconVolumeOff, IconTrash,
  IconExternalLink, IconHome2, IconLeaf, IconUser,
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { messagingService } from '@/services/messaging';
import type { Conversation } from '@/types';

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

  const otherUser = conversation.otherUser;
  const isMuted = conversation.isMuted ?? false;
  const participationDetails = conversation.participationDetails;
  const project = participationDetails?.project;
  const isNatB = project?.projectType === 'NATB';

  const handleToggleMute = async () => {
    setIsTogglingMute(true);
    try {
      await messagingService.toggleMute(conversation._id);
      onMuteToggle?.();
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    } finally {
      setIsTogglingMute(false);
    }
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: t('messaging.deleteConfirm'),
      children: <Text size="sm">{t('messaging.deleteConfirmText')}</Text>,
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await messagingService.deleteConversation(conversation._id);
          onDelete?.();
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
        borderLeft: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      {/* Header */}
      <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', flexShrink: 0 }}>
        <Text fw={700} size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.05em' }}>
          {t('messaging.details')}
        </Text>
      </Box>

      <ScrollArea style={{ flex: 1 }}>
        <Stack gap={0}>

          {/* Project Section */}
          {project && (
            <Box p="md">
              <Stack gap="sm">
                {/* Cover image */}
                <Link href={`/projects/${project._id}`}>
                  <div className="rounded-lg overflow-hidden aspect-[16/9] bg-gray-100">
                    <img
                      src={project.coverImageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'}
                      alt={project.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Link>

                {/* Type badge */}
                <Badge
                  size="xs"
                  radius="xl"
                  variant="light"
                  color={isNatB ? 'eco-primary' : 'eco-terracotta'}
                  leftSection={isNatB ? <IconHome2 size={10} /> : <IconLeaf size={10} />}
                >
                  {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
                </Badge>

                {/* Title + link */}
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                  <Link href={`/projects/${project._id}`} className="no-underline flex-1 min-w-0">
                    <Text fw={700} size="sm" c="dark" className="hover:text-eco-primary transition-colors line-clamp-2">
                      {project.title}
                    </Text>
                  </Link>
                  <Link href={`/projects/${project._id}`} style={{ flexShrink: 0 }}>
                    <IconExternalLink size={14} color="var(--mantine-color-gray-5)" />
                  </Link>
                </Group>

                {/* Location */}
                {(project as any).address?.city && (
                  <Group gap={4} wrap="nowrap">
                    <IconMapPin size={12} className="text-gray-400 flex-shrink-0" />
                    <Text size="xs" c="dimmed" className="truncate">
                      {[(project as any).address.city, (project as any).address.country?.name].filter(Boolean).join(', ')}
                    </Text>
                  </Group>
                )}

                {/* Dates */}
                {(participationDetails?.proposedStartDate || participationDetails?.proposedEndDate) && (
                  <Group gap={4}>
                    <IconCalendar size={12} className="text-gray-400" />
                    <Text size="xs" c="dimmed">
                      {participationDetails.proposedStartDate}
                      {participationDetails.proposedEndDate && ` – ${participationDetails.proposedEndDate}`}
                    </Text>
                  </Group>
                )}


              </Stack>
            </Box>
          )}

          <Divider />

          {/* Host Section — compact */}
          <Box p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm" style={{ letterSpacing: '0.05em' }}>
              {t('messaging.host') || 'Host'}
            </Text>
            <Group gap="sm">
              <Avatar
                src={otherUser?.profilePictureUrl || otherUser?.profilePicture}
                size={40}
                radius="xl"
                color="eco-primary"
              >
                {otherUser?.firstName?.[0]}
              </Avatar>
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} size="sm" className="truncate">
                  {otherUser?.firstName}
                </Text>
                {(otherUser as any)?.address && (
                  <Group gap={4}>
                    <IconMapPin size={11} className="text-gray-400" />
                    <Text size="xs" c="dimmed" className="truncate">
                      {(otherUser as any).address.city}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Group>
            <Button
              variant="light"
              color="eco-primary"
              component={Link}
              href={`/users/${otherUser?.publicId ?? otherUser?._id}`}
              fullWidth
              size="xs"
              radius="xl"
              mt="sm"
              leftSection={<IconUser size={14} />}
            >
              {t('messaging.viewFullProfile')}
            </Button>
          </Box>
        </Stack>
      </ScrollArea>

      {/* Actions */}
      <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)', flexShrink: 0 }}>
        <Stack gap="xs">
          <Button
            variant="subtle"
            size="xs"
            leftSection={isMuted ? <IconVolume size={14} /> : <IconVolumeOff size={14} />}
            onClick={handleToggleMute}
            loading={isTogglingMute}
            fullWidth
            color="gray"
          >
            {isMuted ? t('messaging.unmuteConversation') : t('messaging.muteConversation')}
          </Button>
          <Button
            variant="subtle"
            size="xs"
            color="red"
            leftSection={<IconTrash size={14} />}
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
