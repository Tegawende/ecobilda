'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Group,
  Text,
  Title,
  Badge,
  Card,
  Avatar,
  Center,
  Skeleton,
  SimpleGrid,
  Divider,
  Button,
  Paper,
  ThemeIcon,
} from '@mantine/core';
import {
  IconMapPin,
  IconCalendar,
  IconCash,
  IconRulerMeasure,
  IconClock,
  IconAlertCircle,
  IconBulb,
  IconArrowLeft,
  IconStar,
  IconHome,
  IconSchool,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconBed,
  IconToolsKitchen2,
  IconTrophy,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { MissionImageGallery } from '@/components/missions/MissionImageGallery';
import {
  useMission,
  useMissionFeedback,
  useHelperMissionPhotos,
} from '@/hooks/useConvex';

interface Props {
  id: string;
}

export function LearnDetailClient({ id }: Props) {
  const t = useTranslations();
  const { mission, isLoading } = useMission(id);
  const { feedback } = useMissionFeedback(id);
  const { photos: helperPhotos } = useHelperMissionPhotos(id, true);

  if (isLoading) {
    return (
      <Layout>
        <Container size="xl" py="xl">
          <Stack gap="md">
            <Skeleton h={48} w="60%" />
            <Skeleton h={500} radius="lg" />
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
              <Button component={Link} href="/learn" leftSection={<IconArrowLeft size={16} />}>
                {t('learn.backToLearn')}
              </Button>
            </Stack>
          </Center>
        </Container>
      </Layout>
    );
  }

  // Build image set: mission images + feedback photos + helper public photos
  const missionImages =
    mission.images && mission.images.length > 0
      ? mission.images.map((i: any) => i.url).filter(Boolean)
      : mission.coverImageUrl
        ? [mission.coverImageUrl]
        : [];
  const feedbackPhotos = (feedback as any)?.photoUrls ?? [];
  const helperPhotoUrls = (helperPhotos as any[]).map((p) => p.url).filter(Boolean);
  const allImages = [...missionImages, ...feedbackPhotos, ...helperPhotoUrls];

  const isFormation = mission.type === 'FORMATION';
  const project = mission.project;
  const address = project?.address;

  const fbResultColor = (r?: string) =>
    r === 'SUCCESS' ? 'green' : r === 'PARTIAL_SUCCESS' ? 'yellow' : 'red';

  return (
    <Layout>
      <Container size="xl" py="md">
        <Group mb="md">
          <Button
            component={Link}
            href="/learn"
            variant="subtle"
            size="sm"
            leftSection={<IconArrowLeft size={16} />}
          >
            {t('learn.backToLearn')}
          </Button>
        </Group>

        {/* Title row */}
        <Stack gap="sm" mb="lg">
          <Group gap="xs">
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
            {feedback?.result && (
              <Badge
                size="md"
                variant="filled"
                color={fbResultColor(feedback.result)}
                leftSection={<IconTrophy size={12} />}
                radius="xl"
              >
                {t(`missionFeedback.result.${feedback.result}`)}
              </Badge>
            )}
          </Group>

          <Title order={1} className="text-3xl sm:text-4xl">
            {mission.title}
          </Title>

          {address?.city && (
            <Group gap="xs">
              <IconMapPin size={18} className="text-gray-600" />
              <Text c="dimmed">
                {address.city}
                {address.country?.name ? `, ${address.country.name}` : ''}
              </Text>
            </Group>
          )}
        </Stack>

        {/* Image gallery */}
        {allImages.length > 0 && (
          <div className="mb-8">
            <MissionImageGallery images={allImages} title={mission.title} />
          </div>
        )}

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
          {/* Main column */}
          <div className="lg:col-span-2">
            <Stack gap="lg">
              {/* Description */}
              <Paper radius="xl" p="xl" withBorder>
                <Title order={3} mb="md">
                  {t('missionDetail.about')}
                </Title>
                <Text size="md" lh={1.7} style={{ whiteSpace: 'pre-wrap' }}>
                  {mission.description}
                </Text>
              </Paper>

              {/* Numerical feedback */}
              {feedback && (feedback.totalCostEUR != null || feedback.surfaceM2 != null || feedback.actualDurationDays != null) && (
                <Paper radius="xl" p="xl" withBorder>
                  <Title order={3} mb="lg">
                    {t('learn.numbers')}
                  </Title>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    {feedback.totalCostEUR != null && (
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                          <IconCash size={24} />
                        </ThemeIcon>
                        <Stack gap={0}>
                          <Text size="sm" c="dimmed">
                            {t('missionFeedback.display.totalCost')}
                          </Text>
                          <Text size="lg" fw={700}>
                            {feedback.totalCostEUR}€
                          </Text>
                        </Stack>
                      </Group>
                    )}
                    {feedback.surfaceM2 != null && (
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                          <IconRulerMeasure size={24} />
                        </ThemeIcon>
                        <Stack gap={0}>
                          <Text size="sm" c="dimmed">
                            {t('missionFeedback.display.surface')}
                          </Text>
                          <Text size="lg" fw={700}>
                            {feedback.surfaceM2}m²
                          </Text>
                        </Stack>
                      </Group>
                    )}
                    {feedback.actualDurationDays != null && (
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                          <IconClock size={24} />
                        </ThemeIcon>
                        <Stack gap={0}>
                          <Text size="sm" c="dimmed">
                            {t('missionFeedback.display.duration')}
                          </Text>
                          <Text size="lg" fw={700}>
                            {feedback.actualDurationDays}j
                          </Text>
                        </Stack>
                      </Group>
                    )}
                  </SimpleGrid>
                </Paper>
              )}

              {/* Difficulties */}
              {feedback?.difficultiesText && (
                <Paper radius="xl" p="xl" withBorder>
                  <Group mb="sm">
                    <ThemeIcon size={32} radius="md" color="orange" variant="light">
                      <IconAlertCircle size={20} />
                    </ThemeIcon>
                    <Title order={4}>{t('missionFeedback.display.difficulties')}</Title>
                  </Group>
                  <Text size="md" lh={1.7} style={{ whiteSpace: 'pre-wrap' }}>
                    {feedback.difficultiesText}
                  </Text>
                </Paper>
              )}

              {/* Learnings */}
              {feedback?.learningsText && (
                <Paper radius="xl" p="xl" withBorder>
                  <Group mb="sm">
                    <ThemeIcon size={32} radius="md" color="yellow" variant="light">
                      <IconBulb size={20} />
                    </ThemeIcon>
                    <Title order={4}>{t('missionFeedback.display.learnings')}</Title>
                  </Group>
                  <Text size="md" lh={1.7} style={{ whiteSpace: 'pre-wrap' }}>
                    {feedback.learningsText}
                  </Text>
                </Paper>
              )}

              {/* Skills used */}
              {mission.skills && mission.skills.length > 0 && (
                <Paper radius="xl" p="xl" withBorder>
                  <Title order={4} mb="md">
                    {t('missions.filters.skills')}
                  </Title>
                  <Group gap="xs">
                    {mission.skills.map((s: any) => (
                      <Badge key={s.code} variant="light" radius="xl" size="md">
                        {s.displayNameFr || s.displayNameEn}
                      </Badge>
                    ))}
                  </Group>
                </Paper>
              )}

              {/* Helper photos with captions */}
              {helperPhotos && helperPhotos.length > 0 && (
                <Paper radius="xl" p="xl" withBorder>
                  <Title order={4} mb="md">
                    {t('missionFeedback.display.helperPhotos')}
                  </Title>
                  <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                    {helperPhotos.map((p: any) => (
                      <Stack key={p._id} gap={4}>
                        <img
                          src={p.url}
                          alt={p.caption ?? ''}
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            objectFit: 'cover',
                            borderRadius: 8,
                          }}
                        />
                        {p.caption && (
                          <Text size="xs" c="dimmed">
                            {p.caption}
                          </Text>
                        )}
                        {p.helper && (
                          <Text size="xs" c="dimmed" fs="italic">
                            — {p.helper.firstName}
                          </Text>
                        )}
                      </Stack>
                    ))}
                  </SimpleGrid>
                </Paper>
              )}
            </Stack>
          </div>

          {/* Sidebar */}
          <Stack gap="md" style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
            {/* Mission summary */}
            <Card withBorder radius="lg" padding="md">
              <Stack gap="xs">
                <Group gap={6}>
                  <IconCalendar size={16} />
                  <Text size="sm">
                    {mission.startDate} → {mission.endDate}
                  </Text>
                </Group>
                <Group gap={6}>
                  <Badge variant="light" radius="xl" size="sm">
                    {t(`missions.difficulty.${mission.difficulty}`)}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {mission.maxParticipants} max
                  </Text>
                </Group>
              </Stack>
            </Card>

            {/* Host card */}
            {mission.owner && (
              <Card withBorder radius="lg" padding="md">
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
                  {t('missionDetail.viewHost')}
                </Text>
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
                  href={
                    `/users/${mission.owner.publicId ?? mission.owner._id}` as any
                  }
                  fullWidth
                  variant="light"
                  size="xs"
                  mt="sm"
                  radius="xl"
                >
                  {t('missionDetail.viewHost')}
                </Button>
              </Card>
            )}

            {/* Place card */}
            {project && (
              <Card withBorder radius="lg" padding="md">
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
                  {t('missionDetail.aboutPlace')}
                </Text>
                <Text fw={600} size="sm" mb="xs">
                  {project.title}
                </Text>
                {project.accommodationDetails && (
                  <Group gap={6} wrap="nowrap" align="flex-start" mb="xs">
                    <IconBed size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text size="xs" c="dimmed">
                      {project.accommodationDetails}
                    </Text>
                  </Group>
                )}
                {project.foodDetails && (
                  <Group gap={6} wrap="nowrap" align="flex-start" mb="xs">
                    <IconToolsKitchen2 size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text size="xs" c="dimmed">
                      {project.foodDetails}
                    </Text>
                  </Group>
                )}
                <Group gap="xs" mt="xs">
                  {project.internetProvided && (
                    <Badge size="xs" variant="light" leftSection={<IconWifi size={10} />}>
                      WiFi
                    </Badge>
                  )}
                  {project.familyFriendly && (
                    <Badge size="xs" variant="light" leftSection={<IconBabyCarriage size={10} />}>
                      {t('createPlace.fields.familyFriendly')}
                    </Badge>
                  )}
                  {project.petsAllowed && (
                    <Badge size="xs" variant="light" leftSection={<IconDog size={10} />}>
                      {t('createPlace.fields.petsAllowed')}
                    </Badge>
                  )}
                </Group>
              </Card>
            )}

            {/* CTA back */}
            <Button
              component={Link}
              href="/missions"
              variant="default"
              radius="xl"
              fullWidth
            >
              {t('learn.browseOpenMissions')}
            </Button>
          </Stack>
        </SimpleGrid>
      </Container>
    </Layout>
  );
}
