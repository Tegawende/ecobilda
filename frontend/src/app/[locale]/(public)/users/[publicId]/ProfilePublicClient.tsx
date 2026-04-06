'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
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
  Textarea,
} from '@mantine/core';
import {
  IconMapPin,
  IconLanguage,
  IconStar,
  IconArrowLeft,
  IconUser,
  IconLeaf,
  IconHome2,
  IconMessageCircle,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { getSkillIcon } from '@/lib/skillIcons';
import { getSkillDisplayName } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { getSessionToken } from '@/lib/convexClient';

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
      <IconStar size={16} style={{ color: '#facc15', fill: '#facc15' }} />
      <Text size="sm" fw={600}>
        {value.toFixed(1)}
      </Text>
    </Group>
  );
}

function ReviewResponseForm({
  reviewId,
  onDone,
}: {
  reviewId: string;
  onDone: () => void;
}) {
  const t = useTranslations();
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const addResponse = useMutation(api.reviews.addResponse);

  const handleSubmit = async () => {
    if (response.trim().length < 10) return;
    setSubmitting(true);
    try {
      const token = getSessionToken();
      if (!token) return;
      await addResponse({ token, reviewId: reviewId as any, response: response.trim() });
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="xs" mt="xs">
      <Textarea
        placeholder={t('profile.responseHint')}
        minRows={2}
        value={response}
        onChange={(e) => setResponse(e.currentTarget.value)}
        autoFocus
      />
      <Group gap="xs" justify="flex-end">
        <Button variant="subtle" size="xs" color="gray" onClick={onDone} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button
          size="xs"
          color="eco-primary"
          loading={submitting}
          disabled={response.trim().length < 10}
          onClick={handleSubmit}
        >
          {t('profile.submitResponse')}
        </Button>
      </Group>
    </Stack>
  );
}

export function ProfilePublicClient() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { user: currentUser } = useAuth();
  const publicId = params.publicId as string;
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const profile = useQuery(api.users.getPublicProfile, { publicId });

  const isOwner = !!currentUser && !!profile && (currentUser as any)._id === profile._id;

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
                  <Rating value={profile.averageRating} readOnly size="sm" color="yellow" />
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
                        <Rating value={review.rating} readOnly size="xs" color="yellow" />
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

                      {/* Host response */}
                      {review.response ? (
                        <Paper
                          mt="xs"
                          p="sm"
                          radius="md"
                          style={{ backgroundColor: 'var(--mantine-color-eco-primary-0)' }}
                        >
                          <Group gap={6} mb={4}>
                            <IconMessageCircle size={12} className="text-eco-primary" />
                            <Text size="xs" fw={600} c="eco-primary">
                              {t('profile.hostResponse')}
                            </Text>
                            {review.responseDate && (
                              <Text size="xs" c="dimmed">
                                · {new Date(review.responseDate).toLocaleDateString(locale, {
                                  year: 'numeric',
                                  month: 'long',
                                })}
                              </Text>
                            )}
                          </Group>
                          <Text size="xs">{review.response}</Text>
                        </Paper>
                      ) : isOwner && respondingTo !== review._id ? (
                        <Button
                          variant="subtle"
                          size="xs"
                          color="eco-primary"
                          leftSection={<IconMessageCircle size={12} />}
                          mt="xs"
                          onClick={() => setRespondingTo(review._id)}
                        >
                          {t('profile.replyToReview')}
                        </Button>
                      ) : isOwner && respondingTo === review._id ? (
                        <ReviewResponseForm
                          reviewId={review._id}
                          onDone={() => setRespondingTo(null)}
                        />
                      ) : null}
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
