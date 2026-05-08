'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Container,
  Grid,
  Stack,
  Group,
  Text,
  Title,
  Button,
  Badge,
  Card,
  Avatar,
  Skeleton,
  Center,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconClock,
  IconCash,
  IconHome,
  IconSchool,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconBed,
  IconToolsKitchen2,
  IconStar,
  IconArrowLeft,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { useMission, useMissionsByProject, useCurrentUser } from '@/hooks/useConvex';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { ParticipationRequestModal } from '@/components/participations/ParticipationRequestModal';
import { MissionFeedbackDisplay } from '@/components/missions/MissionFeedbackDisplay';
import { MissionImageGallery } from '@/components/missions/MissionImageGallery';

interface MissionDetailClientProps {
  id: string;
}

export function MissionDetailClient({ id }: MissionDetailClientProps) {
  const t = useTranslations();
  const { mission, isLoading } = useMission(id);
  const { user } = useCurrentUser();
  const { missions: otherMissions } = useMissionsByProject(mission?.projectId ?? null, id);
  const [applyOpen, setApplyOpen] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <Container size="xl" py="xl">
          <Stack gap="md">
            <Skeleton h={48} w="60%" />
            <Skeleton h={400} radius="lg" />
            <Skeleton h={120} />
          </Stack>
        </Container>
      </Layout>
    );
  }

  if (!mission) {
    return (
      <Layout>
        <Container size="md" py="xl">
          <Center h={400}>
            <Stack align="center">
              <Text size="lg" fw={600}>
                {t('missionDetail.notFound')}
              </Text>
              <Button component={Link} href="/missions" leftSection={<IconArrowLeft size={16} />}>
                {t('missionDetail.backToMissions')}
              </Button>
            </Stack>
          </Center>
        </Container>
      </Layout>
    );
  }

  const isOwner = user && mission.ownerId === user._id;
  const isFormation = mission.type === 'FORMATION';
  const project = mission.project;
  const address = project?.address;
  const galleryImages: string[] =
    mission.images && mission.images.length > 0
      ? mission.images.map((i: any) => i.url).filter(Boolean)
      : mission.coverImageUrl
        ? [mission.coverImageUrl]
        : [];

  const canApply =
    !!user && !isOwner && (mission.status === 'PUBLISHED' || mission.status === 'IN_PROGRESS');

  return (
    <Layout>
    <Container size="xl" py="md">
      <Group mb="md">
        <Button
          component={Link}
          href="/missions"
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
        >
          {t('missionDetail.backToMissions')}
        </Button>
      </Group>

      {/* Title row */}
      <Stack gap="sm" mb="lg">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="xs" wrap="wrap">
            <Badge
              size="md"
              radius="xl"
              variant="filled"
              color={isFormation ? 'eco-terracotta' : 'eco-primary'}
              leftSection={isFormation ? <IconSchool size={12} /> : <IconHome size={12} />}
              tt="uppercase"
              fw={700}
              styles={{ root: { letterSpacing: '0.05em' } }}
            >
              {t(`missions.types.${mission.type}`)}
            </Badge>
            <Badge size="md" radius="xl" variant="light" color="dark">
              {t(`missions.difficulty.${mission.difficulty}`)}
            </Badge>
            {isFormation && mission.priceEUR != null && (
              <Badge
                size="md"
                radius="xl"
                variant="filled"
                color="dark"
                leftSection={<IconCash size={12} />}
              >
                {mission.priceEUR}€
              </Badge>
            )}
          </Group>
          {!isOwner && <FavoriteButton missionId={mission._id} size="md" />}
        </Group>

        <Title order={1} className="text-3xl sm:text-4xl">
          {mission.title}
        </Title>

        {address?.city && (
          <Group gap={6}>
            <IconMapPin size={18} />
            <Text c="dimmed">
              {address.city}
              {address.country?.name ? `, ${address.country.name}` : ''}
            </Text>
          </Group>
        )}
      </Stack>

      {/* Image gallery (Airbnb-style) */}
      {galleryImages.length > 0 && (
        <div className="mb-8">
          <MissionImageGallery images={galleryImages} title={mission.title} />
        </div>
      )}

      <Grid gutter="xl" mt="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            <Group gap="lg" wrap="wrap">
              <Group gap={6}>
                <IconCalendar size={16} />
                <Text size="sm">
                  {mission.startDate} → {mission.endDate}
                </Text>
              </Group>
              <Group gap={6}>
                <IconUsers size={16} />
                <Text size="sm">
                  {mission.maxParticipants} {t('missions.helpers')}
                </Text>
              </Group>
              <Group gap={6}>
                <IconClock size={16} />
                <Text size="sm">
                  {mission.hoursPerDay}h × {mission.daysPerWeek}{t('missions.daysPerWeekSuffix')}
                </Text>
              </Group>
            </Group>

            <Divider />

            {/* Poste / technique */}
            {(mission.poste || mission.technique) && (
              <Group gap="xs">
                {mission.poste && (
                  <Badge size="md" variant="filled" color="eco-primary" radius="xl">
                    {t(`missions.poste.${mission.poste}`)}
                  </Badge>
                )}
                {mission.technique && (
                  <Badge size="md" variant="light" color="eco-primary" radius="xl">
                    {t(`missions.technique.${mission.technique}`)}
                  </Badge>
                )}
              </Group>
            )}

            <Stack gap={4}>
              <Text fw={700}>{t('missionDetail.about')}</Text>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{mission.description}</Text>
            </Stack>

            {mission.skills && mission.skills.length > 0 && (
              <Stack gap={4}>
                <Text fw={700}>{t('missions.filters.skills')}</Text>
                <Group gap="xs">
                  {mission.skills.map((s: any) => (
                    <Badge key={s.code} variant="light" radius="xl">
                      {s.displayNameFr || s.displayNameEn}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            )}

            {/* Feedback display when COMPLETED + public */}
            {mission.status === 'COMPLETED' && (
              <MissionFeedbackDisplay missionId={mission._id} />
            )}

            {/* Other missions of this place */}
            {otherMissions.length > 0 && (
              <Stack gap="sm">
                <Text fw={700}>{t('missionDetail.otherMissionsHere')}</Text>
                <Stack gap="xs">
                  {otherMissions.slice(0, 5).map((m: any) => (
                    <Card
                      key={m._id}
                      component={Link as any}
                      href={`/missions/${m._id}`}
                      withBorder
                      radius="md"
                      padding="sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <Group justify="space-between">
                        <Stack gap={2}>
                          <Text size="sm" fw={600}>
                            {m.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {m.startDate} → {m.endDate}
                          </Text>
                        </Stack>
                        <Badge size="xs" variant="light">
                          {t(`missions.status.${m.status}`)}
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md" style={{ position: 'sticky', top: 80 }}>
            {/* Apply CTA */}
            <Card withBorder radius="lg" padding="lg">
              <Stack gap="sm">
                {isOwner ? (
                  <>
                    <Text size="sm" c="dimmed">
                      {t('missionDetail.youAreHost')}
                    </Text>
                    <Button
                      component={Link}
                      href={`/missions/${mission._id}/edit` as any}
                      variant="default"
                      radius="xl"
                    >
                      {t('common.edit')}
                    </Button>
                    {mission.status === 'COMPLETED' && (
                      <Button
                        component={Link}
                        href={`/missions/${mission._id}/feedback` as any}
                        color="eco-primary"
                        radius="xl"
                      >
                        {t('missionFeedback.form.submit')}
                      </Button>
                    )}
                  </>
                ) : canApply ? (
                  <>
                    <Text fw={600}>{t('missionDetail.applyTitle')}</Text>
                    <Text size="sm" c="dimmed">
                      {t('missionDetail.applyDesc')}
                    </Text>
                    <Button
                      onClick={() => setApplyOpen(true)}
                      color="eco-primary"
                      size="md"
                      radius="xl"
                    >
                      {t('missionDetail.applyCta')}
                    </Button>
                  </>
                ) : !user ? (
                  <Button component={Link} href="/login" radius="xl">
                    {t('missionDetail.loginToApply')}
                  </Button>
                ) : (
                  <Text size="sm" c="dimmed">
                    {t('missionDetail.notOpen')}
                  </Text>
                )}
              </Stack>
            </Card>

            {/* Host card */}
            {mission.owner && (
              <Card withBorder radius="lg" padding="md">
                <Group>
                  <Avatar
                    src={mission.owner.profilePictureUrl ?? undefined}
                    size={48}
                    radius="xl"
                    color="eco-primary"
                  >
                    {mission.owner.firstName?.[0]}
                  </Avatar>
                  <Stack gap={0}>
                    <Text fw={600} size="sm">
                      {mission.owner.firstName} {mission.owner.lastName}
                    </Text>
                    {mission.owner.reviewCount > 0 && (
                      <Group gap={4}>
                        <IconStar size={12} color="#fab005" />
                        <Text size="xs" c="dimmed">
                          {mission.owner.averageRating.toFixed(1)} ({mission.owner.reviewCount})
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Group>
                <Button
                  component={Link}
                  href={`/users/${mission.owner.publicId ?? mission.owner._id}` as any}
                  fullWidth
                  variant="subtle"
                  size="xs"
                  mt="sm"
                  radius="xl"
                >
                  {t('missionDetail.viewHost')}
                </Button>
              </Card>
            )}

            {/* Place / amenities */}
            {project && (
              <Card withBorder radius="lg" padding="md">
                <Stack gap="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {t('missionDetail.aboutPlace')}
                  </Text>
                  <Text size="sm" fw={600}>
                    {project.title}
                  </Text>

                  {project.accommodationDetails && (
                    <Group gap={6} wrap="nowrap" align="flex-start">
                      <IconBed size={16} style={{ marginTop: 2 }} />
                      <Text size="sm" c="dimmed">
                        {project.accommodationDetails}
                      </Text>
                    </Group>
                  )}
                  {project.foodDetails && (
                    <Group gap={6} wrap="nowrap" align="flex-start">
                      <IconToolsKitchen2 size={16} style={{ marginTop: 2 }} />
                      <Text size="sm" c="dimmed">
                        {project.foodDetails}
                      </Text>
                    </Group>
                  )}

                  <Group gap="xs" pt={4}>
                    {project.internetProvided && (
                      <Badge size="xs" variant="light" leftSection={<IconWifi size={10} />}>
                        {t('projects.wifi')}
                      </Badge>
                    )}
                    {project.familyFriendly && (
                      <Badge size="xs" variant="light" leftSection={<IconBabyCarriage size={10} />}>
                        {t('projects.familyFriendly')}
                      </Badge>
                    )}
                    {project.petsAllowed && (
                      <Badge size="xs" variant="light" leftSection={<IconDog size={10} />}>
                        {t('projects.petsAllowed')}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      <ParticipationRequestModal
        missionId={mission._id}
        missionTitle={mission.title}
        opened={applyOpen}
        onClose={() => setApplyOpen(false)}
      />
    </Container>
    </Layout>
  );
}
