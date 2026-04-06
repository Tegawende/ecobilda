'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm } from '@mantine/form';
import { useLocale, useTranslations } from 'next-intl';
import logger from '@/lib/logger';
import {
  Paper,
  Card,
  Title,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Alert,
  Grid,
  FileButton,
  Avatar,
  Text,
  Skeleton,
  Combobox,
  useCombobox,
  InputBase,
  Loader,
  ThemeIcon,
  MultiSelect,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconUser,
  IconMapPin,
  IconTools,
  IconCheck,
  IconHome2,
  IconLeaf,
  IconSearch,
} from '@tabler/icons-react';
import { profileService } from '@/services/profile';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import { DateOfBirthSelect, validateDateOfBirth } from '@/components/common/DateOfBirthSelect';
import { useSkills, useLanguages } from '@/hooks/useConvex';
import { getSkillIcon } from '@/lib/skillIcons';
import { getSkillDisplayName, type User, type Skill } from '@/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface CityResult {
  label: string; // "City, Country"
  city: string;
  country: string;
  countryCode: string;
  postalCode: string;
}

async function searchCities(query: string, lang: string): Promise<CityResult[]> {
  if (!query || query.length < 2 || !MAPBOX_TOKEN) return [];

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
      `access_token=${MAPBOX_TOKEN}&types=place,locality&limit=5&language=${lang}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.features || []).map((feature: any) => {
      const city = feature.text || '';
      const context = feature.context || [];
      const countryCtx = context.find((c: any) => c.id?.startsWith('country'));
      const postcodeCtx = context.find((c: any) => c.id?.startsWith('postcode'));
      const country = countryCtx?.text || '';
      const countryCode = countryCtx?.short_code?.toUpperCase() || '';
      const postalCode = postcodeCtx?.text || '';

      return {
        label: `${city}, ${country}`,
        city,
        country,
        countryCode,
        postalCode,
      };
    });
  } catch (error) {
    logger.error('Mapbox geocoding error:', error);
    return [];
  }
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  dob_day: string;
  dob_month: string;
  dob_year: string;
  city: string;
  postalCode: string;
  countryCode: string;
  skills: string[];
  languages: string[];
}

interface EditProfileFormProps {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export function EditProfileForm({ user, onSave, onCancel }: EditProfileFormProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { skills: allSkills, isLoading: isLoadingSkills } = useSkills();
  const { languages: rawLanguages } = useLanguages();
  const availableLanguages = useMemo(() => {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    return rawLanguages
      .map((l) => {
        const localized = displayNames.of(l.code);
        const label = localized ? localized.charAt(0).toUpperCase() + localized.slice(1) : l.name;
        return { value: l.code, label };
      })
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [rawLanguages, locale]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user.profilePictureUrl || user.profilePicture || '');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');

  // City autocomplete state
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [cityDisplay, setCityDisplay] = useState(() => {
    const city = user.address?.city || '';
    const country = (user.address?.country as any)?.name || '';
    return city ? `${city}${country ? `, ${country}` : ''}` : '';
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const form = useForm<ProfileFormData>({
    initialValues: (() => {
      let dobDay = '', dobMonth = '', dobYear = '';
      if (user.dateOfBirth) {
        const parts = String(user.dateOfBirth).split('-');
        if (parts.length === 3) {
          dobYear = parts[0];
          dobMonth = String(parseInt(parts[1], 10));
          dobDay = String(parseInt(parts[2], 10));
        }
      }
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || '',
        dob_day: dobDay,
        dob_month: dobMonth,
        dob_year: dobYear,
        city: user.address?.city || '',
        postalCode: user.address?.postalCode || '',
        countryCode: (user.address?.country as any)?.code || user.address?.country || '',
        skills: user.skills?.map((s) => s.code) || [],
        languages: user.languages?.map((l) => l.code) || [locale],
      };
    })(),
    validate: {
      firstName: (value) => (value.length >= 2 ? null : t('profile.edit.firstNameError')),
      lastName: (value) => (value.length >= 2 ? null : t('profile.edit.lastNameError')),
      bio: (value) => (value.length <= 1000 ? null : t('profile.edit.bioError')),
      dob_year: (val, values) => {
        if (!values.dob_day && !values.dob_month && !val) return null;
        return validateDateOfBirth(values.dob_day, values.dob_month, val, t);
      },
    },
  });

  // City search with debounce
  const handleCitySearch = useCallback((query: string) => {
    setCitySearch(query);
    setCityDisplay(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 2) {
      setCityResults([]);
      return;
    }

    setIsSearchingCity(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchCities(query, locale);
      setCityResults(results);
      setIsSearchingCity(false);
      if (results.length > 0) {
        combobox.openDropdown();
      }
    }, 300);
  }, [locale, combobox]);

  const handleCitySelect = (result: CityResult) => {
    setCityDisplay(result.label);
    setCitySearch('');
    setCityResults([]);
    form.setFieldValue('city', result.city);
    form.setFieldValue('countryCode', result.countryCode);
    form.setFieldValue('postalCode', result.postalCode);
    combobox.closeDropdown();
  };

  // Skills and languages are now loaded reactively via Convex hooks

  const toggleSkill = (skillCode: string) => {
    const currentSkills = form.values.skills;
    if (currentSkills.includes(skillCode)) {
      form.setFieldValue(
        'skills',
        currentSkills.filter((s) => s !== skillCode)
      );
    } else {
      form.setFieldValue('skills', [...currentSkills, skillCode]);
    }
  };

  const handleImageChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('profile.edit.invalidImage'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('profile.edit.imageTooLarge'));
      return;
    }

    setError('');
    setRawImageSrc(URL.createObjectURL(file));
    setCropModalOpen(true);
  };

  const handleCropComplete = (croppedFile: File) => {
    setProfilePicture(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedFile));
  };

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setError('');

      const dobString = data.dob_day && data.dob_month && data.dob_year
        ? `${data.dob_year}-${data.dob_month.padStart(2, '0')}-${data.dob_day.padStart(2, '0')}`
        : undefined;

      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio,
        dateOfBirth: dobString,
        city: data.city,
        countryCode: data.countryCode,
        skillCodes: data.skills,
        languageCodes: data.languages,
      };

      if (profilePicture) {
        updateData.profilePicture = profilePicture;
      }

      const updatedUser = await profileService.updateProfile(updateData);
      onSave(updatedUser);
    } catch (err: any) {
      logger.error('Failed to update profile:', err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'object'
          ? Object.values(err.response.data).flat().join(', ')
          : null) ||
        t('profile.edit.updateFailed');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSkillCard = (skill: Skill, category: 'NATB' | 'PERM') => {
    const isSelected = form.values.skills.includes(skill.code);
    const color = category === 'NATB' ? '#70A771' : '#c9696b';
    const SkillIcon = getSkillIcon(skill.icon);
    return (
      <Grid.Col key={skill.code} span={{ base: 6, sm: 4, md: 3 }}>
        <Card
          padding="md"
          withBorder
          h="100%"
          style={{
            cursor: 'pointer',
            borderWidth: 2,
            borderColor: isSelected ? color : '#e5e7eb',
            backgroundColor: isSelected ? `${color}15` : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 64,
            transition: 'all 0.15s ease',
          }}
          onClick={() => toggleSkill(skill.code)}
        >
          <Group wrap="nowrap" justify="center" w="100%">
            <SkillIcon size={22} style={{ flexShrink: 0, color: isSelected ? color : '#6b7280' }} />
            <Text size="sm" ta="center" fw={isSelected ? 600 : 400} style={{ color: isSelected ? color : '#4b5563' }}>
              {getSkillDisplayName(skill, locale)}
            </Text>
          </Group>
        </Card>
      </Grid.Col>
    );
  };

  return (
    <>
    <Paper radius="lg" p={{ base: 'lg', sm: 'xl' }} shadow="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="xl">

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} variant="light" radius="md">
              {error}
            </Alert>
          )}

          {/* Profile Picture - centered */}
          <Stack align="center" gap="sm" py="md">
            <div className="relative">
              <Avatar
                src={previewUrl}
                size={120}
                radius={120}
                imageProps={{ referrerPolicy: 'no-referrer' }}
                className="border-4 border-eco-primary/20"
              >
                <IconUser size={56} className="text-gray-400" />
              </Avatar>
              <FileButton onChange={handleImageChange} accept="image/png,image/jpeg,image/jpg">
                {(props) => (
                  <Button
                    {...props}
                    variant="filled"
                    color="eco-primary"
                    size="xs"
                    radius="xl"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-md"
                  >
                    {t('profile.edit.changePhoto')}
                  </Button>
                )}
              </FileButton>
            </div>
            <Text size="xs" c="dimmed">{t('profile.edit.imageHint')}</Text>
          </Stack>

          {/* Basic Info */}
          <Stack gap="md">
            <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {t('profile.personalInfo')}
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('profile.edit.firstName')}
                  radius="md"
                  size="md"
                  {...form.getInputProps('firstName')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('profile.edit.lastName')}
                  radius="md"
                  size="md"
                  {...form.getInputProps('lastName')}
                />
              </Grid.Col>
            </Grid>

            {/* Date of Birth */}
            <DateOfBirthSelect
              values={{ dob_day: form.values.dob_day, dob_month: form.values.dob_month, dob_year: form.values.dob_year }}
              onChange={(field, value) => form.setFieldValue(field, value)}
              error={form.errors.dob_year ? String(form.errors.dob_year) : null}
              variant="profile"
            />

            {/* Bio */}
            <Textarea
              label={t('profile.bio')}
              placeholder={t('profile.bioPlaceholder')}
              minRows={4}
              maxLength={1000}
              radius="md"
              size="md"
              {...form.getInputProps('bio')}
              description={`${form.values.bio.length} / 1000 ${t('profile.edit.characters')}`}
            />
          </Stack>

          {/* Location */}
          <Stack gap="md">
            <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {t('profile.location')}
            </Text>
            <Combobox
              store={combobox}
              onOptionSubmit={(val) => {
                const result = cityResults.find(r => r.label === val);
                if (result) handleCitySelect(result);
              }}
            >
              <Combobox.Target>
                <InputBase
                  placeholder={t('profile.edit.cityPlaceholder')}
                  value={cityDisplay}
                  onChange={(e) => {
                    handleCitySearch(e.currentTarget.value);
                  }}
                  onBlur={() => combobox.closeDropdown()}
                  leftSection={<IconMapPin size={18} className="text-eco-terracotta" />}
                  rightSection={isSearchingCity ? <Loader size={16} /> : null}
                  radius="md"
                  size="md"
                />
              </Combobox.Target>

              {cityResults.length > 0 && (
                <Combobox.Dropdown>
                  <Combobox.Options>
                    {cityResults.map((result, index) => (
                      <Combobox.Option key={`${result.label}-${index}`} value={result.label}>
                        <Group gap="xs">
                          <IconMapPin size={14} className="text-eco-terracotta" />
                          <Text size="sm">{result.label}</Text>
                        </Group>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox.Dropdown>
              )}
            </Combobox>
          </Stack>

          {/* Languages */}
          <Stack gap="md">
            <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {t('profile.languages')}
            </Text>
            <MultiSelect
              placeholder={t('profile.edit.languagesPlaceholder')}
              data={availableLanguages}
              value={form.values.languages}
              onChange={(val) => form.setFieldValue('languages', val)}
              searchable
              clearable
              radius="md"
              size="md"
            />
          </Stack>

          {/* Skills */}
          <Stack gap="md">
            <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {t('profile.edit.yourSkills')}
            </Text>
            <Text size="sm" c="dimmed">
              {t('profile.edit.skillsHint')}
            </Text>

            {isLoadingSkills ? (
              <Grid gutter="xs">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid.Col key={i} span={{ base: 6, sm: 4, md: 3 }}>
                    <Skeleton height={60} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Stack gap="lg">
                {/* Natural Building */}
                {allSkills.filter(s => s.category === 'NATB').length > 0 && (
                  <div>
                    <Group gap="xs" mb="sm">
                      <IconHome2 size={16} className="text-eco-primary" />
                      <Text size="sm" fw={600} c="dimmed">{t('projects.naturalBuilding')}</Text>
                    </Group>
                    <Grid gutter="xs">
                      {allSkills.filter(s => s.category === 'NATB').map((skill) => renderSkillCard(skill, 'NATB'))}
                    </Grid>
                  </div>
                )}

                {/* Permaculture */}
                {allSkills.filter(s => s.category === 'PERM').length > 0 && (
                  <div>
                    <Group gap="xs" mb="sm">
                      <IconLeaf size={16} className="text-eco-terracotta" />
                      <Text size="sm" fw={600} c="dimmed">{t('projects.permaculture')}</Text>
                    </Group>
                    <Grid gutter="xs">
                      {allSkills.filter(s => s.category === 'PERM').map((skill) => renderSkillCard(skill, 'PERM'))}
                    </Grid>
                  </div>
                )}
              </Stack>
            )}
            <Text size="sm" c="dimmed">
              {t('profile.edit.skillsSelected', { count: form.values.skills.length })}
            </Text>
          </Stack>

          {/* Actions */}
          <Group justify="flex-end" pt="md" className="border-t border-gray-100">
            <Button variant="default" onClick={onCancel} disabled={isSubmitting} radius="md" size="md">
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={<IconDeviceFloppy size={18} />}
              color="eco-blue"
              radius="md"
              size="md"
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>

    <ImageCropModal
      opened={cropModalOpen}
      onClose={() => setCropModalOpen(false)}
      imageSrc={rawImageSrc}
      onCropComplete={handleCropComplete}
      cropShape="round"
      aspect={1}
    />
    </>
  );
}
