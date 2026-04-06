'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Layout } from '@/components/common/Layout';
import { useAuth } from '@/providers/AuthProvider';
import { participationsService } from '@/services/participations';
import {
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconClock,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconSmoking,
  IconHome,
  IconLeaf,
  IconStar,
} from '@tabler/icons-react';
import { ProjectImageGallery } from '@/components/projects/ProjectImageGallery';
import { useProject } from '@/hooks/useConvex';
import { getSkillIcon } from '@/lib/skillIcons';
import {
  Loader,
  Center,
  Container,
  Stack,
  Group,
  Textarea,
  Alert,
  Modal,
  Title,
  Text,
  Paper,
  Badge,
  SimpleGrid,
  ThemeIcon,
  Avatar,
  Button,
  Divider,
} from '@mantine/core';

export function ProjectDetailClient({ id: projectId }: { id?: string }) {
  const t = useTranslations();
  const params = useParams();
  const id = projectId || (params?.id as string);
  const { project, isLoading } = useProject(id);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<{ status: string; _id: string } | null>(null);

  // Check if user already applied to this project
  useEffect(() => {
    if (!isAuthenticated) return;
    participationsService.getMyParticipations().then((participations) => {
      const existing = participations.find(
        (p: any) => p.projectId === id && (p.status === 'PENDING' || p.status === 'ACCEPTED' || p.status === 'REFUSED')
      );
      if (existing) setExistingRequest({ status: existing.status, _id: existing._id });
    }).catch(() => {});
  }, [isAuthenticated, id]);

  if (isLoading) {
    return (
      <Layout>
        <Center mih="60vh"><Loader size="lg" /></Center>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <Center mih="60vh">
          <Stack align="center" gap="md">
            <Title order={2}>{t('projectDetail.notFound')}</Title>
            <Link href="/projects" className="text-eco-primary hover:underline">{t('projectDetail.backToProjects')}</Link>
          </Stack>
        </Center>
      </Layout>
    );
  }

  const isNatB = project.projectType === 'NATB';
  // Get all images as array of strings
  const projectImages = project.images && project.images.length > 0
    ? project.images.map(img => img.url || '')
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200'];

  return (
    <Layout>
      <div className="bg-white min-h-screen pb-20">
        <Container size="xl" pt="xl">
          {/* Title and Location Header */}
          <Stack gap="sm" mb="lg">
            <Badge
              size="md"
              color={isNatB ? 'eco-primary' : 'eco-terracotta'}
              leftSection={isNatB ? <IconHome size={14} /> : <IconLeaf size={14} />}
              tt="uppercase"
              variant="filled"
              style={{ letterSpacing: '0.05em' }}
            >
              {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
            </Badge>
            <Title order={1} className="text-4xl sm:text-5xl font-display">{project.title}</Title>
            <Group gap="xs">
              <IconMapPin size={22} className="text-gray-600" />
              <Text size="lg" c="dimmed">
                {project.address?.city}, {project.address?.country?.name}
              </Text>
            </Group>
          </Stack>

          {/* Photo Gallery */}
          <div className="mb-8">
            <ProjectImageGallery images={projectImages} title={project.title} />
          </div>

          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <Stack gap="xl">
                {/* About */}
                <Paper radius="xl" p="xl" withBorder>
                  <Title order={3} mb="md" className="font-display">{t('projectDetail.about')}</Title>
                  <Text size="lg" c="dimmed" lh={1.7}>
                    {project.description}
                  </Text>
                </Paper>

                {/* Work Details */}
                <Paper radius="xl" p="xl" withBorder>
                  <Title order={3} mb="lg" className="font-display">{t('projectDetail.workDetails')}</Title>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                        <IconClock size={24} />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text size="sm" c="dimmed">{t('projectDetail.hoursPerDay')}</Text>
                        <Text size="lg" fw={700}>{project.hoursPerDay}h</Text>
                      </Stack>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                        <IconCalendar size={24} />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text size="sm" c="dimmed">{t('projectDetail.daysPerWeek')}</Text>
                        <Text size="lg" fw={700}>{project.daysPerWeek}d</Text>
                      </Stack>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                        <IconUsers size={24} />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text size="sm" c="dimmed">{t('projectDetail.maxVolunteers')}</Text>
                        <Text size="lg" fw={700}>{project.maxHelpers}</Text>
                      </Stack>
                    </Group>
                  </SimpleGrid>
                </Paper>

                {/* Amenities */}
                <Paper radius="xl" p="xl" withBorder>
                  <Title order={3} mb="lg" className="font-display">{t('projectDetail.amenities')}</Title>
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    {[
                      { available: project.internetProvided, icon: IconWifi, label: 'WiFi', sublabel: project.internetProvided ? t('common.included') : t('common.no') },
                      { available: project.familyFriendly, icon: IconBabyCarriage, label: t('projects.families'), sublabel: project.familyFriendly ? t('common.welcome') : t('common.no') },
                      { available: project.petsAllowed, icon: IconDog, label: t('projects.pets'), sublabel: project.petsAllowed ? t('common.accepted') : t('common.no') },
                      { available: project.smokingAllowed, icon: IconSmoking, label: t('projects.smoking'), sublabel: project.smokingAllowed ? t('common.allowed') : t('common.no') },
                    ].map((amenity, idx) => (
                      <Paper
                        key={idx}
                        radius="md"
                        p="md"
                        withBorder
                        style={{
                          borderWidth: 2,
                          borderColor: amenity.available ? 'var(--color-eco-primary)' : 'var(--mantine-color-gray-3)',
                          opacity: amenity.available ? 1 : 0.5,
                          backgroundColor: amenity.available ? 'var(--color-eco-primary-light, rgba(103,163,111,0.05))' : undefined,
                        }}
                      >
                        <Stack align="center" gap={4}>
                          <amenity.icon size={28} className={amenity.available ? 'text-eco-primary' : 'text-gray-400'} />
                          <Text size="sm" fw={500}>{amenity.label}</Text>
                          <Text size="xs" c="dimmed">{amenity.sublabel}</Text>
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Paper>

                {/* Accommodation & Food */}
                <Paper radius="xl" p="xl" withBorder>
                  <Title order={3} mb="lg" className="font-display">{t('projectDetail.accommodation')}</Title>
                  <Stack gap="lg">
                    <div>
                      <Text fw={600} mb="xs">{t('projectDetail.accommodationType')}</Text>
                      <Text c="dimmed">{project.accommodationDetails || t('projectDetail.notSpecified')}</Text>
                    </div>
                    <Divider />
                    <div>
                      <Text fw={600} mb="xs">{t('projectDetail.meals')}</Text>
                      <Text c="dimmed">{project.foodDetails || t('projectDetail.notSpecified')}</Text>
                    </div>
                  </Stack>
                </Paper>

                {/* Skills */}
                {project.skills && project.skills.length > 0 && (
                  <Paper radius="xl" p="xl" withBorder>
                    <Title order={3} mb="lg" className="font-display">{t('projectDetail.skills')}</Title>
                    <Group gap="xs">
                      {project.skills.map((skill, idx) => {
                        const SkillIcon = getSkillIcon(skill.icon);
                        return (
                          <Badge
                            key={idx}
                            size="lg"
                            variant="light"
                            color="eco-primary"
                            leftSection={<SkillIcon size={16} />}
                            radius="xl"
                          >
                            {skill.displayNameEn}
                          </Badge>
                        );
                      })}
                    </Group>
                  </Paper>
                )}

                {/* Languages */}
                {(project as any).languages && (project as any).languages.length > 0 && (
                  <Paper radius="xl" p="xl" withBorder>
                    <Title order={3} mb="lg" className="font-display">{t('projectDetail.languages')}</Title>
                    <Group gap="xs">
                      {((project as any).languages as Array<{code: string; name: string}>).map((lang) => (
                        <Badge
                          key={lang.code}
                          size="lg"
                          variant="light"
                          color="gray"
                          radius="xl"
                        >
                          {lang.name}
                        </Badge>
                      ))}
                    </Group>
                  </Paper>
                )}

                {/* Availability */}
                {project.availabilities && project.availabilities.length > 0 && (
                  <Paper radius="xl" p="xl" withBorder>
                    <Title order={3} mb="lg" className="font-display">{t('projectDetail.availability')}</Title>
                    {project.availabilities.map((avail) => {
                      const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;
                      const monthNames: string[] = t.raw('auth.dobMonths');
                      return (
                        <div key={avail._id || avail.year}>
                          <Text fw={600} mb="sm">{avail.year}</Text>
                          <SimpleGrid cols={{ base: 3, sm: 4, md: 6 }} spacing="xs">
                            {monthKeys.map((key, idx) => {
                              const available = avail[key];
                              return (
                                <Paper
                                  key={key}
                                  radius="md"
                                  py="xs"
                                  px={4}
                                  ta="center"
                                  bg={available ? 'var(--color-eco-primary-light, rgba(103,163,111,0.1))' : 'gray.0'}
                                  style={{ color: available ? 'var(--color-eco-primary)' : 'var(--mantine-color-gray-4)' }}
                                >
                                  <Text size="sm" fw={500} inherit>
                                    {monthNames[idx]?.slice(0, 3)}
                                  </Text>
                                </Paper>
                              );
                            })}
                          </SimpleGrid>
                        </div>
                      );
                    })}
                  </Paper>
                )}

                {/* Host */}
                {project.owner && (
                  <Paper radius="xl" p="xl" withBorder>
                    <Title order={3} mb="lg" className="font-display">{t('projectDetail.yourHost')}</Title>
                    <Group gap="md">
                      <Avatar
                        src={project.owner?.profilePictureUrl || undefined}
                        alt={`${project.owner?.firstName} ${project.owner?.lastName}`}
                        size="lg"
                        radius="xl"
                        color="eco-primary"
                        component={project.owner?.publicId ? Link : 'div'}
                        {...(project.owner?.publicId ? { href: `/users/${project.owner.publicId}` } : {})}
                        style={project.owner?.publicId ? { cursor: 'pointer' } : undefined}
                      />
                      <Stack gap={0}>
                        {project.owner?.publicId ? (
                          <Link href={`/users/${project.owner.publicId}`} className="no-underline hover:underline">
                            <Text fw={700} size="lg" c="eco-primary">
                              {project.owner?.firstName} {project.owner?.lastName}
                            </Text>
                          </Link>
                        ) : (
                          <Text fw={700} size="lg">
                            {project.owner?.firstName} {project.owner?.lastName}
                          </Text>
                        )}
                        <Group gap={4}>
                          <IconStar size={16} className="text-yellow-500" />
                          <Text size="sm" c="dimmed">
                            {Number(project.owner?.averageRating || 0).toFixed(1)} ({project.owner?.reviewCount} {t('projects.reviews')})
                          </Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>
                )}
              </Stack>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Paper radius="xl" p="lg" shadow="xl" withBorder className="sticky top-24">
                <Title order={3} mb="lg" className="font-display">{t('projectDetail.details')}</Title>

                <Stack gap="md" mb="xl">
                  <Group justify="space-between" pb="md" className="border-b border-gray-100">
                    <Text size="sm" c="dimmed">{t('projectDetail.status')}</Text>
                    <Text fw={700} c={project.isActive ? 'eco-primary' : 'dimmed'}>
                      {project.isActive ? t('common.active') : t('common.inactive')}
                    </Text>
                  </Group>
                  <Group justify="space-between" pb="md" className="border-b border-gray-100">
                    <Text size="sm" c="dimmed">Type</Text>
                    <Group gap={4}>
                      {isNatB ? <IconHome size={16} /> : <IconLeaf size={16} />}
                      <Text fw={700}>{isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}</Text>
                    </Group>
                  </Group>
                  <Group justify="space-between" pb="md" className="border-b border-gray-100">
                    <Text size="sm" c="dimmed">{t('projectDetail.volunteers')}</Text>
                    <Group gap="xs">
                      <IconUsers size={18} className="text-gray-400" />
                      <Text fw={700}>{project.maxHelpers} max</Text>
                    </Group>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t('projectDetail.location')}</Text>
                    <Group gap="xs">
                      <IconMapPin size={18} className="text-gray-400" />
                      <Text fw={700}>{project.address?.city}</Text>
                    </Group>
                  </Group>
                </Stack>

                {/* Application Button */}
                {!(isAuthenticated && user?._id === project.ownerId) && (
                  applySuccess || existingRequest ? (
                    <Alert
                      color={
                        applySuccess ? 'green'
                        : existingRequest?.status === 'ACCEPTED' ? 'green'
                        : existingRequest?.status === 'REFUSED' ? 'red'
                        : 'blue'
                      }
                      variant="light"
                    >
                      {applySuccess
                        ? t('projectDetail.applySuccess')
                        : existingRequest?.status === 'ACCEPTED'
                        ? t('projectDetail.applicationAccepted')
                        : existingRequest?.status === 'REFUSED'
                        ? t('projectDetail.applicationRefused')
                        : t('projectDetail.alreadyApplied')}
                    </Alert>
                  ) : (
                    <Stack gap="md">
                      <Button
                        fullWidth
                        size="lg"
                        radius="md"
                        color="eco-primary"
                        className="shadow-lg shadow-eco-primary/20 hover:-translate-y-1 transition-all"
                        onClick={() => {
                          if (!isAuthenticated) {
                            router.push('/login');
                            return;
                          }
                          if (!motivation) {
                            setMotivation(t('projectDetail.defaultMotivation', { projectTitle: project.title }));
                          }
                          setApplyModalOpen(true);
                        }}
                      >
                        {!isAuthenticated
                          ? t('projectDetail.loginToApply')
                          : t('projectDetail.apply')}
                      </Button>
                      {!isAuthenticated && (
                        <Text size="xs" c="dimmed" ta="center">
                          {t('projectDetail.loginRequired')}
                        </Text>
                      )}

                    </Stack>
                  )
                )}
              </Paper>
            </div>
          </SimpleGrid>
        </Container>
      </div>
      {/* Apply Modal */}
      <Modal
        opened={applyModalOpen}
        onClose={() => { setApplyModalOpen(false); setApplyError(null); }}
        title={t('projectDetail.applyModalTitle')}
        centered
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('projectDetail.applyModalDesc')}
          </Text>

          <Textarea
            value={motivation}
            onChange={(e) => setMotivation(e.currentTarget.value)}
            minRows={6}
            autosize
            maxRows={12}
          />

          {motivation.trim().length > 0 && motivation.trim().length < 20 && (
            <Text size="xs" c="red">
              {t('projectDetail.motivationMin')}
            </Text>
          )}

          {applyError && (
            <Alert color="red" variant="light">
              {applyError}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setApplyModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              color="eco-primary"
              loading={isApplying}
              disabled={motivation.trim().length < 20}
              onClick={async () => {
                setIsApplying(true);
                setApplyError(null);
                try {
                  await participationsService.createRequest({
                    project: id,
                    motivation: motivation.trim(),
                  });
                  setApplySuccess(true);
                  setApplyModalOpen(false);
                } catch (err: any) {
                  setApplyError(err.message || t('projectDetail.applyError'));
                } finally {
                  setIsApplying(false);
                }
              }}
            >
              {t('projectDetail.sendApplication')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Layout>
  );
}
