'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslations, useLocale } from 'next-intl';
import {
  Container, Title, Text, Paper, Button, Group, Stack, Avatar, Badge,
  Rating, Alert, Divider, ThemeIcon,
} from '@mantine/core';
import {
  IconPencil, IconMapPin, IconMail, IconMessage, IconHome2, IconLeaf,
  IconGift, IconArrowLeft, IconLanguage, IconUser, IconAlertCircle,
  IconStar,
} from '@tabler/icons-react';
import { getSkillIcon } from '@/lib/skillIcons';
import { Layout } from '@/components/common/Layout';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { getSkillDisplayName, type Review } from '@/types';
import { convexClient } from '@/lib/convexClient';
import { api } from '../../../../../convex/_generated/api';

function getLocalizedLanguageName(code: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    const name = displayNames.of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Paper radius="md" p="md" withBorder>
      <Group align="flex-start" gap="md">
        <Avatar
          src={review.writer?.profilePictureUrl}
          alt={`${review.writer?.firstName} ${review.writer?.lastName}`}
          size="md"
          radius="xl"
        />
        <Stack gap={4} style={{ flex: 1 }}>
          <Group justify="space-between" align="center">
            <Text fw={600} size="sm">
              {review.writer?.firstName} {review.writer?.lastName}
            </Text>
            <Rating value={review.rating} readOnly size="xs" color="yellow" />
          </Group>
          <Text size="xs" c="dimmed">
            {review._creationTime
              ? new Date(review._creationTime).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : ''}
          </Text>
          <Text size="sm" mt={4}>{review.feedback}</Text>

          {review.response && (
            <Paper radius="sm" p="sm" bg="gray.0" mt="xs" style={{ borderLeft: '3px solid var(--mantine-color-green-6)' }}>
              <Text size="xs" fw={600} c="green.7" mb={2}>
                {t('profile.yourResponse')}
              </Text>
              <Text size="sm" c="dimmed">{review.response}</Text>
            </Paper>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

export function ProfileClient() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(searchParams?.get('edit') === '1');
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('@/services/profile').then(({ profileService }) => {
      profileService.getProfile()
        .then(async (data) => {
          setUser(data);
          // Fetch reviews after getting user
          if (data?._id) {
            try {
              const userReviews = await convexClient.query(api.reviews.getByUser, { userId: data._id });
              setReviews(userReviews ?? []);
            } catch {
              // Reviews are non-critical, fail silently
            }
          }
          setLoading(false);
        })
        .catch(() => {
          setError(t('profile.loadError'));
          setLoading(false);
        });
    });
  }, []);

  const { refreshUser } = useAuth();

  const handleSave = useCallback(async (data: any) => {
    setUser({ ...user, ...data });
    setIsEditing(false);
    await refreshUser();
  }, [user, refreshUser]);

  if (loading) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12">
          <Container size="sm">
            <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
              {error || t('profile.loadError')}
            </Alert>
          </Container>
        </div>
      </Layout>
    );
  }

  if (isEditing) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12">
          <Container size="sm">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => setIsEditing(false)}
              mb="md"
            >
              {t('profile.backToProfile')}
            </Button>
            <EditProfileForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} />
          </Container>
        </div>
      </Layout>
    );
  }

  const natbSkills = (user.skills ?? []).filter((s: any) => s.category === 'NATB');
  const permSkills = (user.skills ?? []).filter((s: any) => s.category === 'PERM');
  const hasSkills = natbSkills.length > 0 || permSkills.length > 0;
  const memberSince = user._creationTime
    ? new Date(user._creationTime).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
    : null;

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="sm">
          <Stack gap="xl">

            {/* Page heading */}
            <Group gap="md">
              <ThemeIcon size={48} radius="md" color="green" variant="light">
                <IconUser size={28} />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={1} className="font-display">
                  {t('profile.title')}
                </Title>
                <Text c="dimmed">{t('profile.subtitle')}</Text>
              </Stack>
            </Group>

            {/* Header card: avatar + name + rating + edit button */}
            <Paper radius="lg" p="xl" withBorder>
              <Group align="flex-start" gap="lg" wrap="wrap">
                <Avatar
                  src={user.profilePictureUrl || user.profilePicture}
                  alt={`${user.firstName} ${user.lastName}`}
                  size={96}
                  radius="xl"
                  style={{ border: '3px solid var(--mantine-color-green-2)' }}
                />

                <Stack gap="xs" style={{ flex: 1, minWidth: 200 }}>
                  <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
                    <Stack gap={2}>
                      <Title order={2} className="font-display">
                        {user.firstName} {user.lastName}
                      </Title>
                      {memberSince && (
                        <Text size="xs" c="dimmed">
                          {t('profile.memberSince', { date: memberSince })}
                        </Text>
                      )}
                    </Stack>
                    <Button
                      variant="outline"
                      color="green"
                      radius="xl"
                      size="sm"
                      leftSection={<IconPencil size={16} />}
                      onClick={() => setIsEditing(true)}
                    >
                      {t('profile.editProfile')}
                    </Button>
                  </Group>

                  {/* Rating */}
                  {user.reviewCount > 0 ? (
                    <Group gap="xs" mt="xs">
                      <IconStar size={18} style={{ color: 'var(--mantine-color-yellow-5)' }} />
                      <Text fw={600} size="sm">
                        {user.averageRating?.toFixed(1)}
                      </Text>
                      <Rating value={user.averageRating} readOnly fractions={2} size="sm" color="yellow" />
                      <Text size="sm" c="dimmed">
                        ({user.reviewCount} {user.reviewCount === 1 ? t('profile.review') : t('profile.reviews')})
                      </Text>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" mt="xs">
                      {t('profile.noReviewsYet', { defaultValue: 'No reviews yet' })}
                    </Text>
                  )}

                  {/* Email */}
                  <Group gap="xs" mt={4}>
                    <IconMail size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />
                    <Text size="sm" c="dimmed">{user.email}</Text>
                  </Group>

                  {/* Date of birth */}
                  {user.dateOfBirth && (
                    <Group gap="xs">
                      <IconGift size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />
                      <Text size="sm" c="dimmed">
                        {new Date(user.dateOfBirth).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {' '}({Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} {t('profile.yearsOld')})
                      </Text>
                    </Group>
                  )}
                </Stack>
              </Group>
            </Paper>

            {/* Public info section */}
            <Paper radius="lg" p="xl" withBorder>
              <Stack gap="lg">
                <Title order={4}>{t('profile.publicInfoTitle')}</Title>

                <Divider />

                {/* Bio */}
                <Stack gap={6}>
                  <Group gap="xs">
                    <IconUser size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                      {t('profile.about')}
                    </Text>
                  </Group>
                  {user.bio ? (
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{user.bio}</Text>
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">{t('profile.noBio')}</Text>
                  )}
                </Stack>

                {/* Location */}
                <Stack gap={6}>
                  <Group gap="xs">
                    <IconMapPin size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                      {t('profile.location')}
                    </Text>
                  </Group>
                  {user.address?.city ? (
                    <Text size="sm">
                      {[user.address.city, user.address.country?.name].filter(Boolean).join(', ')}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">{t('profile.noLocation')}</Text>
                  )}
                </Stack>

                {/* Languages */}
                <Stack gap={6}>
                  <Group gap="xs">
                    <IconLanguage size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                      {t('profile.languages')}
                    </Text>
                  </Group>
                  {user.languages && user.languages.length > 0 ? (
                    <Group gap="xs">
                      {user.languages.map((lang: any) => (
                        <Badge key={lang.code} variant="light" color="green" size="sm">
                          {getLocalizedLanguageName(lang.code, locale)}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">{t('profile.noLanguages')}</Text>
                  )}
                </Stack>

                {/* Skills */}
                <Stack gap={6}>
                  <Group gap="xs">
                    <IconLeaf size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                      {t('profile.skills')}
                    </Text>
                  </Group>

                  {hasSkills ? (
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
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">{t('profile.noSkills')}</Text>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {/* Reviews section */}
            <Paper radius="lg" p="xl" withBorder>
              <Stack gap="lg">
                <Group gap="sm" align="center">
                  <IconMessage size={22} style={{ color: 'var(--mantine-color-green-7)' }} />
                  <Title order={4} className="font-display">
                    {t('profile.reviewsTitle')}
                  </Title>
                  {reviews.length > 0 && (
                    <Badge variant="filled" color="green" size="sm" radius="xl">
                      {reviews.length}
                    </Badge>
                  )}
                  {user.reviewCount > 0 && (
                    <Group gap={4} ml="auto">
                      <Rating value={user.averageRating} readOnly fractions={2} size="sm" color="yellow" />
                      <Text size="sm" fw={600}>{user.averageRating?.toFixed(1)}</Text>
                    </Group>
                  )}
                </Group>

                {reviews.length > 0 ? (
                  <Stack gap="md">
                    {reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" fs="italic" ta="center" py="md">
                    {t('profile.noReviewsYet', { defaultValue: 'No reviews yet' })}
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
