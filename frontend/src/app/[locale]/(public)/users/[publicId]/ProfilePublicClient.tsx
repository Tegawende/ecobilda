'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Container, Title, Text, Paper, Group, Stack, Avatar, Badge,
  Rating, Loader, Center, ThemeIcon, Divider, Button, Textarea,
} from '@mantine/core';
import {
  IconMapPin, IconLanguage, IconStar, IconArrowLeft, IconUser,
  IconLeaf, IconHome2, IconMessageCircle,
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
        <div className="bg-stone-50 min-h-screen py-12 flex items-center justify-center">
          <Loader color="eco-primary" />
        </div>
      </Layout>
    );
  }

  if (profile === null) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12">
          <Container size="sm">
            <Stack align="center" gap="md" py="xl">
              <ThemeIcon size={64} radius="xl" color="gray" variant="light">
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
        </div>
      </Layout>
    );
  }

  const joinYear = new Date(profile._creationTime).getFullYear();
  const reviewLabel = profile.reviewCount === 1 ? t('profile.review') : t('profile.reviews');

  const natbSkills = (profile.skills ?? []).filter((s: any) => s.category === 'NATB');
  const permSkills = (profile.skills ?? []).filter((s: any) => s.category === 'PERM');
  const hasSkills = natbSkills.length > 0 || permSkills.length > 0;

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="sm">
          <Stack gap="xl">

            {/* Back button */}
            <Button
              variant="subtle"
              size="sm"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
              color="eco-primary"
              className="self-start"
            >
              {t('common.back')}
            </Button>

            {/* Header card */}
            <Paper radius="lg" p="xl" withBorder>
              <Group align="flex-start" gap="lg" wrap="wrap">
                <Avatar
                  src={profile.profilePictureUrl}
                  alt={profile.firstName}
                  size={96}
                  radius="xl"
                  style={{ border: '3px solid var(--mantine-color-green-2)' }}
                >
                  {profile.firstName?.[0]}
                </Avatar>

                <Stack gap="xs" style={{ flex: 1, minWidth: 200 }}>
                  <Title order={2} className="font-display">
                    {profile.firstName}
                  </Title>

                  {profile.reviewCount > 0 ? (
                    <Group gap="xs">
                      <IconStar size={18} style={{ color: 'var(--mantine-color-yellow-5)' }} />
                      <Text fw={600} size="sm">
                        {profile.averageRating.toFixed(1)}
                      </Text>
                      <Rating value={profile.averageRating} readOnly fractions={2} size="sm" color="yellow" />
                      <Text size="sm" c="dimmed">
                        ({profile.reviewCount} {reviewLabel})
                      </Text>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      {t('profile.noReviewsYet')}
                    </Text>
                  )}

                  {profile.address?.city && (
                    <Group gap={6}>
                      <IconMapPin size={14} style={{ color: 'var(--mantine-color-gray-5)' }} />
                      <Text size="sm" c="dimmed">
                        {[profile.address.city, profile.address.country?.name].filter(Boolean).join(', ')}
                      </Text>
                    </Group>
                  )}

                  <Text size="xs" c="dimmed">
                    {t('profile.memberSince', { date: String(joinYear) })}
                  </Text>
                </Stack>
              </Group>

              {profile.bio && (
                <>
                  <Divider my="md" />
                  <Stack gap={6}>
                    <Group gap="xs">
                      <IconUser size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                      <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                        {t('profile.about')}
                      </Text>
                    </Group>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {profile.bio}
                    </Text>
                  </Stack>
                </>
              )}
            </Paper>

            {/* Languages & Skills */}
            {(hasSkills || (profile.languages && profile.languages.length > 0)) && (
              <Paper radius="lg" p="xl" withBorder>
                <Stack gap="lg">

                  {/* Languages */}
                  {profile.languages && profile.languages.length > 0 && (
                    <Stack gap={6}>
                      <Group gap="xs">
                        <IconLanguage size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                          {t('profile.languages')}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        {profile.languages.map((lang: any) => (
                          <Badge key={lang._id} variant="light" color="green" size="sm">
                            {getLocalizedLanguageName(lang.code, locale)}
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  )}

                  {profile.languages && profile.languages.length > 0 && hasSkills && <Divider />}

                  {/* Skills */}
                  {hasSkills && (
                    <Stack gap={6}>
                      <Group gap="xs">
                        <IconLeaf size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                          {t('profile.skills')}
                        </Text>
                      </Group>
                      <Stack gap="sm">
                        {natbSkills.length > 0 && (
                          <Stack gap={6}>
                            <Group gap="xs">
                              <IconHome2 size={14} style={{ color: 'var(--mantine-color-green-7)' }} />
                              <Text size="xs" c="dimmed" fw={600}>{t('projects.naturalBuilding')}</Text>
                            </Group>
                            <Group gap="xs" wrap="wrap">
                              {natbSkills.map((skill: any) => {
                                const SkillIcon = getSkillIcon(skill.icon);
                                return (
                                  <Badge key={skill.code} variant="light" color="green" size="sm" leftSection={<SkillIcon size={12} />}>
                                    {getSkillDisplayName(skill, locale)}
                                  </Badge>
                                );
                              })}
                            </Group>
                          </Stack>
                        )}
                        {permSkills.length > 0 && (
                          <Stack gap={6}>
                            <Group gap="xs">
                              <IconLeaf size={14} style={{ color: 'var(--mantine-color-teal-7)' }} />
                              <Text size="xs" c="dimmed" fw={600}>{t('projects.permaculture')}</Text>
                            </Group>
                            <Group gap="xs" wrap="wrap">
                              {permSkills.map((skill: any) => {
                                const SkillIcon = getSkillIcon(skill.icon);
                                return (
                                  <Badge key={skill.code} variant="light" color="teal" size="sm" leftSection={<SkillIcon size={12} />}>
                                    {getSkillDisplayName(skill, locale)}
                                  </Badge>
                                );
                              })}
                            </Group>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <Paper radius="lg" p="xl" withBorder>
                <Stack gap="md">
                  <Group gap="xs">
                    <IconHome2 size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                      {t('nav.projects')}
                    </Text>
                  </Group>
                  <Stack gap="xs">
                    {profile.projects.map((project: any) => (
                      <Group key={project._id} gap="sm" wrap="nowrap" p="sm" className="rounded-lg hover:bg-gray-50 transition-colors">
                        <Badge
                          size="xs"
                          variant="light"
                          color={project.projectType === 'PERM' ? 'teal' : 'eco-primary'}
                          leftSection={project.projectType === 'PERM' ? <IconLeaf size={10} /> : <IconHome2 size={10} />}
                        >
                          {project.projectType === 'PERM' ? t('projects.permaculture') : t('projects.naturalBuilding')}
                        </Badge>
                        <Text size="sm" fw={500} truncate className="flex-1">
                          {project.title}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            )}

            {/* Reviews */}
            <Paper radius="lg" p="xl" withBorder>
              <Stack gap="lg">
                <Group gap="sm" align="center">
                  <IconMessageCircle size={22} style={{ color: 'var(--mantine-color-green-7)' }} />
                  <Title order={4} className="font-display">
                    {t('profile.reviewsTitle')}
                  </Title>
                  {profile.reviewCount > 0 && (
                    <Badge variant="filled" color="green" size="sm" radius="xl">
                      {profile.reviewCount}
                    </Badge>
                  )}
                  {profile.reviewCount > 0 && (
                    <Group gap={4} ml="auto">
                      <Rating value={profile.averageRating} readOnly fractions={2} size="sm" color="yellow" />
                      <Text size="sm" fw={600}>{profile.averageRating?.toFixed(1)}</Text>
                    </Group>
                  )}
                </Group>

                {profile.reviews && profile.reviews.length > 0 ? (
                  <Stack gap="md">
                    {profile.reviews.map((review: any) => (
                      <Paper key={review._id} radius="md" p="md" withBorder>
                        <Group align="flex-start" gap="md">
                          <Avatar
                            src={review.writer?.profilePictureUrl}
                            alt={review.writer?.firstName}
                            size="md"
                            radius="xl"
                          >
                            {review.writer?.firstName?.[0]}
                          </Avatar>
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Group justify="space-between" align="center">
                              <Text fw={600} size="sm">
                                {review.writer?.firstName}
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

                            {review.response ? (
                              <Paper mt="xs" p="sm" radius="sm" bg="gray.0" style={{ borderLeft: '3px solid var(--mantine-color-green-6)' }}>
                                <Group gap={6} mb={4}>
                                  <IconMessageCircle size={12} className="text-eco-primary" />
                                  <Text size="xs" fw={600} c="green.7">
                                    {t('profile.hostResponse')}
                                  </Text>
                                </Group>
                                <Text size="sm" c="dimmed">{review.response}</Text>
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
                ) : (
                  <Text size="sm" c="dimmed" fs="italic" ta="center" py="md">
                    {t('profile.noReviewsYet')}
                  </Text>
                )}
              </Stack>
            </Paper>

          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
