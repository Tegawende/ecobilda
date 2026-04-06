'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { useTranslations, useLocale } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Stack,
  Avatar,
  Badge,
  Rating,
  Loader,
  Center,
  ThemeIcon,
  Divider,
  Button,
} from '@mantine/core';
import {
  IconMapPin,
  IconLanguage,
  IconStar,
  IconArrowLeft,
  IconUser,
  IconLeaf,
  IconHome2,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { getSkillIcon } from '@/lib/skillIcons';
import { getSkillDisplayName } from '@/types';

function getLocalizedLanguageName(code: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    const name = displayNames.of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

function StarRating({ value }: { value: number }) {
  return (
    <Group gap={4} align="center">
      <IconStar size={16} className="text-eco-terracotta fill-eco-terracotta" />
      <Text size="sm" fw={600}>
        {value.toFixed(1)}
      </Text>
    </Group>
  );
}

export function ProfilePublicClient() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const publicId = params.publicId as string;

  const profile = useQuery(api.users.getPublicProfile, { publicId });

  if (profile === undefined) {
    return (
      <Layout>
        <Center h={400}>
          <Loader color="eco-primary" />
        </Center>
      </Layout>
    );
  }

  if (profile === null) {
    return (
      <Layout>
        <Container size="md" py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="eco-primary" variant="light">
              <IconUser size={32} />
            </ThemeIcon>
            <Title order={2}>{t('errors.notFound.title')}</Title>
            <Text c="dimmed">{t('errors.notFound.description')}</Text>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              {t('common.back')}
            </Button>
          </Stack>
        </Container>
      </Layout>
    );
  }

  const joinYear = new Date(profile._creationTime).getFullYear();
  const reviewLabel =
    profile.reviewCount === 1 ? t('profile.review') : t('profile.reviews');

  return (
    <Layout>
      <Container size="md" py="xl">
        {/* Back */}
        <Button
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
          mb="lg"
          color="eco-primary"
        >
          {t('common.back')}
        </Button>

        {/* Header card */}
        <Paper radius="xl" p="xl" withBorder mb="lg">
          <Group align="flex-start" gap="xl">
            <Avatar
              src={profile.profilePictureUrl}
              alt={`${profile.firstName} ${profile.lastName}`}
              size={100}
              radius="xl"
              className="border-2 border-eco-primary/20"
            >
              {profile.firstName?.[0]}
              {profile.lastName?.[0]}
            </Avatar>

            <Stack gap="xs" className="flex-1">
              <Title order={2}>
                {profile.firstName} {profile.lastName}
              </Title>

              {profile.averageRating > 0 && (
                <Group gap="xs">
                  <Rating value={profile.averageRating} readOnly size="sm" color="eco-terracotta" />
                  <Text size="sm" c="dimmed">
                    {profile.averageRating.toFixed(1)} · {profile.reviewCount} {reviewLabel}
                  </Text>
                </Group>
              )}

              {profile.address?.city && (
                <Group gap={6}>
                  <IconMapPin size={14} className="text-eco-primary" />
                  <Text size="sm" c="dimmed">
                    {[profile.address.city, profile.address.country?.name]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </Group>
              )}

              <Text size="sm" c="dimmed">
                {t('profile.memberSince', { date: String(joinYear) })}
              </Text>
            </Stack>
          </Group>

          {profile.bio && (
            <>
              <Divider my="md" />
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {profile.bio}
              </Text>
            </>
          )}
        </Paper>

        <Group align="flex-start" gap="lg" grow>
          {/* Left column */}
          <Stack gap="lg" style={{ flex: '1 1 300px' }}>
            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <Paper radius="xl" p="lg" withBorder>
                <Group gap="sm" mb="md">
                  <ThemeIcon size={32} radius="xl" color="eco-primary" variant="light">
                    <IconLanguage size={18} />
                  </ThemeIcon>
                  <Title order={4}>{t('profile.languages')}</Title>
                </Group>
                <Group gap="xs">
                  {profile.languages.map((lang: any) => (
                    <Badge key={lang._id} variant="light" color="eco-primary" radius="xl">
                      {getLocalizedLanguageName(lang.code, locale)}
                    </Badge>
                  ))}
                </Group>
              </Paper>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Paper radius="xl" p="lg" withBorder>
                <Group gap="sm" mb="md">
                  <ThemeIcon size={32} radius="xl" color="eco-green-6" variant="light">
                    <IconLeaf size={18} />
                  </ThemeIcon>
                  <Title order={4}>{t('profile.skills')}</Title>
                </Group>
                <Stack gap="xs">
                  {profile.skills.map((skill: any) => {
                    const SkillIcon = getSkillIcon(skill.code);
                    return (
                      <Group key={skill._id} gap="sm">
                        <ThemeIcon size={28} radius="xl" color="eco-green-6" variant="light">
                          <SkillIcon size={16} />
                        </ThemeIcon>
                        <Text size="sm">{getSkillDisplayName(skill, locale)}</Text>
                      </Group>
                    );
                  })}
                </Stack>
              </Paper>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <Paper radius="xl" p="lg" withBorder>
                <Group gap="sm" mb="md">
                  <ThemeIcon size={32} radius="xl" color="eco-terracotta" variant="light">
                    <IconHome2 size={18} />
                  </ThemeIcon>
                  <Title order={4}>{t('nav.projects')}</Title>
                </Group>
                <Stack gap="xs">
                  {profile.projects.map((project: any) => (
                    <Group key={project._id} gap="sm" wrap="nowrap">
                      <Badge
                        size="xs"
                        variant="light"
                        color={project.projectType === 'PERM' ? 'eco-green-6' : 'eco-terracotta'}
                      >
                        {project.projectType === 'PERM'
                          ? t('projects.permaculture')
                          : t('projects.naturalBuilding')}
                      </Badge>
                      <Text size="sm" truncate>
                        {project.title}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>

          {/* Right column — Reviews */}
          {profile.reviews && profile.reviews.length > 0 && (
            <Stack gap="md" style={{ flex: '1 1 400px' }}>
              <Title order={4}>
                {t('profile.reviewsTitle')} ({profile.reviewCount})
              </Title>
              {profile.reviews.map((review: any) => (
                <Paper key={review._id} radius="xl" p="lg" withBorder>
                  <Group align="flex-start" gap="md">
                    <Avatar
                      src={review.writer?.profilePictureUrl}
                      alt={`${review.writer?.firstName} ${review.writer?.lastName}`}
                      size="md"
                      radius="xl"
                    >
                      {review.writer?.firstName?.[0]}
                      {review.writer?.lastName?.[0]}
                    </Avatar>
                    <Stack gap={4} className="flex-1">
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={600}>
                          {review.writer?.firstName} {review.writer?.lastName}
                        </Text>
                        <Rating value={review.rating} readOnly size="xs" color="eco-terracotta" />
                      </Group>
                      <Text size="xs" c="dimmed">
                        {new Date(review._creationTime).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </Text>
                      <Text size="sm" mt={4} style={{ lineHeight: 1.6 }}>
                        {review.feedback}
                      </Text>
                      {review.response && (
                        <Paper
                          mt="xs"
                          p="sm"
                          radius="md"
                          style={{ backgroundColor: 'var(--mantine-color-eco-primary-0)' }}
                        >
                          <Text size="xs" fw={600} mb={4}>
                            {t('profile.yourResponse')}
                          </Text>
                          <Text size="xs">{review.response}</Text>
                        </Paper>
                      )}
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Group>
      </Container>
    </Layout>
  );
}
