'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Container, Title, Text, Paper, Button, Group, Stack, Avatar, Badge, Rating, TextInput, Textarea, ThemeIcon, Alert } from '@mantine/core';
import {
  IconPencil,
  IconMapPin,
  IconMail,
  IconMessage,
  IconHammer,
  IconLeaf,
  IconGift,
  IconArrowLeft,
  IconLanguage,
  IconUser,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getSkillIcon } from '@/lib/skillIcons';
import { Layout } from '@/components/common/Layout';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import type { Review, Skill } from '@/types';

function getSkillDisplayName(skill: Skill, locale: string): string {
  const key = `display_name_${locale}` as keyof Skill;
  return (skill[key] as string) || skill.display_name_en;
}

function getLocalizedLanguageName(code: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    const name = displayNames.of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

// Review Card Component using Mantine
function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations();

  return (
    <Paper radius="lg" p="lg" withBorder>
      <Group align="flex-start" gap="md">
        <Avatar
          src={review.writer.profile_picture}
          alt={`${review.writer.first_name} ${review.writer.last_name}`}
          size="lg"
          radius="xl"
          className="border-2 border-eco-primary/20"
        />
        <Stack gap="xs" className="flex-1">
          <Group justify="space-between">
            <Title order={5}>
              {review.writer.first_name} {review.writer.last_name}
            </Title>
            <Rating value={review.rating} readOnly size="sm" color="eco-terracotta" />
          </Group>
          <Text size="sm" c="dimmed">
            {new Date(review.created_at).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text size="sm">{review.feedback}</Text>

          {review.response && (
            <Paper radius="md" p="sm" bg="var(--mantine-color-eco-primary-light)" className="border-l-2 border-eco-primary">
              <Text size="sm" fw={600} c="eco-primary" mb={4}>
                {t('profile.yourResponse') || 'Your response'}
              </Text>
              <Text size="sm" c="dimmed">{review.response}</Text>
            </Paper>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

// EditProfileForm imported from @/components/profile/EditProfileForm

export function ProfileClient() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(searchParams?.get('edit') === '1');
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('@/services/profile').then(({ profileService }) => {
      profileService.getProfile()
        .then(data => { setUser(data); setLoading(false); })
        .catch(err => { setError('Failed to load profile'); setLoading(false); });
    });
  }, []);

  const handleSave = (data: any) => {
    setUser({ ...user, ...data });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12">
          <Container size="sm">
            <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error') || 'Error'}>
              {error || t('profile.loadError') || 'Could not load profile'}
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
              {t('profile.backToProfile') || 'Back to Profile'}
            </Button>
            <EditProfileForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} />
          </Container>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="sm">
          <Stack gap="lg">
            {/* Header */}
            <Group gap="md" mb="xl">
              <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                <IconUser size={28} />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={1} className="font-display">
                  {t('profile.title') || 'My Profile'}
                </Title>
                <Text c="dimmed">
                  {t('profile.subtitle') || 'Your personal information'}
                </Text>
              </Stack>
            </Group>

            {/* Profile Header Card */}
            <Paper radius="lg" p="lg" withBorder>
              <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                <IconInfoCircle size={24} className="text-eco-primary" />
                <Title order={4} className="font-display">
                  {t('profile.personalInfo') || 'Personal Information'}
                </Title>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  radius="xl"
                  size="xs"
                  leftSection={<IconPencil size={16} />}
                  onClick={() => setIsEditing(true)}
                >
                  {t('profile.editProfile') || 'Edit Profile'}
                </Button>
              </Group>

              <Stack gap="md">
                <Group align="flex-start" gap="lg" wrap="wrap">
                  {/* Avatar */}
                  <Avatar
                    src={user.profile_picture}
                    alt={`${user.first_name} ${user.last_name}`}
                    size={96}
                    radius="xl"
                    className="border-4 border-eco-primary/20"
                  />

                  {/* User Info */}
                  <Stack gap="xs" className="flex-1" style={{ minWidth: 200 }}>
                    <Title order={2} className="font-display">
                      {user.first_name} {user.last_name}
                    </Title>
                    <Group gap="xs">
                      <IconMail size={16} className="text-gray-500" />
                      <Text c="dimmed">{user.email}</Text>
                    </Group>

                    {user.review_count > 0 && (
                      <Group gap="xs" mt="xs">
                        <Rating value={user.average_rating} readOnly fractions={2} color="eco-terracotta" />
                        <Text size="sm" c="dimmed">
                          ({user.review_count} {user.review_count === 1 ? (t('profile.review') || 'review') : (t('profile.reviews') || 'reviews')})
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Group>

                {/* Bio */}
                <Stack gap="xs" pt="md" className="border-t border-gray-100">
                  <Group gap="xs">
                    <IconUser size={16} className="text-gray-500" />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                      {t('profile.about') || 'About'}
                    </Text>
                  </Group>
                  <Text className="whitespace-pre-wrap">{user.bio || t('profile.noBio') || 'No bio yet'}</Text>
                </Stack>

                {/* Details Grid */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Location */}
                  {user.address && (
                    <Stack gap="xs">
                      <Group gap="xs">
                        <IconMapPin size={16} className="text-eco-terracotta" />
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                          {t('profile.location') || 'Location'}
                        </Text>
                      </Group>
                      <Text fw={500}>{user.address.city}, {user.address.country?.name}</Text>
                    </Stack>
                  )}

                  {/* Date of Birth */}
                  {user.date_of_birth && (
                    <Stack gap="xs">
                      <Group gap="xs">
                        <IconGift size={16} className="text-eco-terracotta" />
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                          {t('profile.birthday') || 'Birthday'}
                        </Text>
                      </Group>
                      <Text fw={500}>
                        {new Date(user.date_of_birth).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </Stack>
                  )}

                  {/* Languages */}
                  {user.languages && user.languages.length > 0 && (
                    <Stack gap="xs">
                      <Group gap="xs">
                        <IconLanguage size={16} className="text-eco-terracotta" />
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                          {t('profile.languages') || 'Languages'}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        {user.languages.map((lang: any) => (
                          <Badge key={lang.code} variant="light" color="eco-primary" size="sm">
                            {getLocalizedLanguageName(lang.code, locale)}
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  )}

                  {/* Skills - Natural Building */}
                  {user.skills && user.skills.filter((s: any) => s.category === 'NATB').length > 0 && (
                    <Stack gap="xs">
                      <Group gap="xs">
                        <IconHammer size={16} className="text-eco-terracotta" />
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                          {t('projects.naturalBuilding') || 'Natural Building'}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        {user.skills.filter((s: any) => s.category === 'NATB').map((skill: any) => {
                          const SkillIcon = getSkillIcon(skill.icon);
                          return (
                            <Badge key={skill.code} variant="light" color="eco-primary" size="sm" leftSection={<SkillIcon size={14} />}>
                              {getSkillDisplayName(skill, locale)}
                            </Badge>
                          );
                        })}
                      </Group>
                    </Stack>
                  )}

                  {/* Skills - Permaculture */}
                  {user.skills && user.skills.filter((s: any) => s.category === 'PERM').length > 0 && (
                    <Stack gap="xs">
                      <Group gap="xs">
                        <IconLeaf size={16} className="text-eco-terracotta" />
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                          {t('projects.permaculture') || 'Permaculture'}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        {user.skills.filter((s: any) => s.category === 'PERM').map((skill: any) => {
                          const SkillIcon = getSkillIcon(skill.icon);
                          return (
                            <Badge key={skill.code} variant="light" color="eco-terracotta" size="sm" leftSection={<SkillIcon size={14} />}>
                              {getSkillDisplayName(skill, locale)}
                            </Badge>
                          );
                        })}
                      </Group>
                    </Stack>
                  )}
                </div>
              </Stack>
            </Paper>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <Paper radius="lg" p="lg" withBorder>
                <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                  <IconMessage size={24} className="text-eco-primary" />
                  <Title order={4} className="font-display">
                    {t('profile.reviewsTitle') || 'Reviews'} ({reviews.length})
                  </Title>
                </Group>
                <Stack gap="md">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
