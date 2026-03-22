'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { useLocale, useTranslations } from 'next-intl';
import logger from '@/lib/logger';
import {
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
import { DateOfBirthSelect, validateDateOfBirth } from '../common/DateOfBirthSelect';
import { skillsService } from '@/services/skills';
import { languagesService } from '@/services/languages';
import { getSkillIcon } from '@/lib/skillIcons';
import type { User, Skill } from '@/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface CityResult {
  label: string; // "City, Country"
  city: string;
  country: string;
  country_code: string;
  postal_code: string;
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
      const country_code = countryCtx?.short_code?.toUpperCase() || '';
      const postal_code = postcodeCtx?.text || '';

      return {
        label: `${city}, ${country}`,
        city,
        country,
        country_code,
        postal_code,
      };
    });
  } catch (error) {
    logger.error('Mapbox geocoding error:', error);
    return [];
  }
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  bio: string;
  dob_day: string;
  dob_month: string;
  dob_year: string;
  city: string;
  postal_code: string;
  country_code: string;
  skills: string[];
  languages: string[];
}

interface EditProfileFormProps {
  user: User;
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

function getSkillDisplayName(skill: Skill, locale: string): string {
  const key = `display_name_${locale}` as keyof Skill;
  return (skill[key] as string) || skill.display_name_en;
}

export function EditProfileForm({ user, onSuccess, onCancel }: EditProfileFormProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<{ value: string; label: string }[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user.profile_picture || '');

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
      if (user.date_of_birth) {
        const parts = String(user.date_of_birth).split('-');
        if (parts.length === 3) {
          dobYear = parts[0];
          dobMonth = String(parseInt(parts[1], 10));
          dobDay = String(parseInt(parts[2], 10));
        }
      }
      return {
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio || '',
        dob_day: dobDay,
        dob_month: dobMonth,
        dob_year: dobYear,
        city: user.address?.city || '',
        postal_code: user.address?.postal_code || '',
        country_code: (user.address?.country as any)?.code || user.address?.country || '',
        skills: user.skills?.map((s) => s.code) || [],
        languages: user.languages?.map((l) => l.code) || [locale],
      };
    })(),
    validate: {
      first_name: (value) => (value.length >= 2 ? null : t('profile.edit.firstNameError')),
      last_name: (value) => (value.length >= 2 ? null : t('profile.edit.lastNameError')),
      bio: (value) => (value.length <= 1000 ? null : t('profile.edit.bioError')),
      dob_year: (val, values) => {
        if (!values.dob_day && !values.dob_month && !val) return null; // optional if empty
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
    form.setFieldValue('country_code', result.country_code);
    form.setFieldValue('postal_code', result.postal_code);
    combobox.closeDropdown();
  };

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skills = await skillsService.getSkills();
        const skillsArray = Array.isArray(skills) ? skills : (skills as any).results || [];
        setAllSkills(skillsArray);
      } catch (error) {
        logger.error('Failed to fetch skills:', error);
        setAllSkills([]);
      } finally {
        setIsLoadingSkills(false);
      }
    };
    const fetchLanguages = async () => {
      try {
        const langs = await languagesService.getLanguages();
        const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
        setAvailableLanguages(
          langs.map(l => {
            const localized = displayNames.of(l.code);
            // Capitalize first letter
            const label = localized ? localized.charAt(0).toUpperCase() + localized.slice(1) : l.name;
            return { value: l.code, label };
          }).sort((a, b) => a.label.localeCompare(b.label, locale))
        );
      } catch (error) {
        logger.error('Failed to fetch languages:', error);
      }
    };
    fetchSkills();
    fetchLanguages();
  }, []);

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

    setProfilePicture(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setError('');

      const dobString = data.dob_day && data.dob_month && data.dob_year
        ? `${data.dob_year}-${data.dob_month.padStart(2, '0')}-${data.dob_day.padStart(2, '0')}`
        : undefined;

      const updateData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
        date_of_birth: dobString,
        city: data.city,
        country_code: data.country_code,
        skill_codes: data.skills,
        language_codes: data.languages,
      };

      if (profilePicture) {
        updateData.profile_picture = profilePicture;
      }

      const updatedUser = await profileService.updateProfile(updateData);
      onSuccess(updatedUser);
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

  const renderSkillCard = (skill: Skill, categoryColor: string) => {
    const isSelected = form.values.skills.includes(skill.code);
    return (
      <Grid.Col key={skill.code} span={{ base: 6, sm: 4, md: 3 }}>
        <Card
          padding="sm"
          withBorder
          h="100%"
          style={{
            cursor: 'pointer',
            borderWidth: 2,
            borderColor: isSelected ? `var(--mantine-color-${categoryColor}-6)` : undefined,
            backgroundColor: isSelected ? `var(--mantine-color-${categoryColor}-0)` : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 56,
          }}
          onClick={() => toggleSkill(skill.code)}
        >
          <Group wrap="nowrap" justify="center" w="100%">
            {(() => { const SkillIcon = getSkillIcon(skill.icon); return <SkillIcon size={20} className="text-gray-600 shrink-0" />; })()}
            <Text size="sm" ta="center">
              {getSkillDisplayName(skill, locale)}
            </Text>
            {isSelected && (
              <ThemeIcon color={categoryColor} variant="light" size="sm">
                <IconCheck size={14} />
              </ThemeIcon>
            )}
          </Group>
        </Card>
      </Grid.Col>
    );
  };

  return (
    <Card withBorder shadow="sm" padding="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={2}>{t('profile.editProfile')}</Title>

          {error && (
            <Alert color="red" icon={<IconAlertCircle />} title={t('common.error')}>
              {error}
            </Alert>
          )}

          {/* Profile Picture */}
          <div>
            <Text fw={500} mb="sm">
              {t('profile.edit.profilePicture')}
            </Text>
            <Group>
              <Avatar src={previewUrl} size={96} radius="xl">
                <IconUser size={48} />
              </Avatar>
              <div>
                <FileButton onChange={handleImageChange} accept="image/*">
                  {(props) => (
                    <Button {...props} variant="outline" size="sm">
                      {t('profile.edit.changePhoto')}
                    </Button>
                  )}
                </FileButton>
                <Text size="xs" c="dimmed" mt={4}>
                  {t('profile.edit.imageHint')}
                </Text>
              </div>
            </Group>
          </div>

          {/* Basic Info */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('profile.edit.firstName')}
                {...form.getInputProps('first_name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('profile.edit.lastName')}
                {...form.getInputProps('last_name')}
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
            {...form.getInputProps('bio')}
            description={`${form.values.bio.length} / 1000 ${t('profile.edit.characters')}`}
          />

          {/* Location - City Autocomplete */}
          <div>
            <Group mb="sm">
              <IconMapPin size={20} color="var(--mantine-color-blue-6)" />
              <Text fw={500}>{t('profile.location')}</Text>
            </Group>

            <Combobox
              store={combobox}
              onOptionSubmit={(val) => {
                const result = cityResults.find(r => r.label === val);
                if (result) handleCitySelect(result);
              }}
            >
              <Combobox.Target>
                <InputBase
                  label={t('profile.edit.city')}
                  placeholder={t('profile.edit.cityPlaceholder')}
                  value={cityDisplay}
                  onChange={(e) => {
                    handleCitySearch(e.currentTarget.value);
                  }}
                  onBlur={() => combobox.closeDropdown()}
                  leftSection={<IconSearch size={16} />}
                  rightSection={isSearchingCity ? <Loader size={16} /> : null}
                />
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {cityResults.length > 0 ? (
                    cityResults.map((result, index) => (
                      <Combobox.Option key={`${result.label}-${index}`} value={result.label}>
                        <Group gap="xs">
                          <IconMapPin size={14} className="text-eco-terracotta" />
                          <Text size="sm">{result.label}</Text>
                        </Group>
                      </Combobox.Option>
                    ))
                  ) : citySearch.length >= 2 && !isSearchingCity ? (
                    <Combobox.Empty>{t('profile.edit.noResults')}</Combobox.Empty>
                  ) : null}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </div>

          {/* Languages */}
          <MultiSelect
            label={t('profile.languages') || 'Languages'}
            placeholder={t('profile.edit.languagesPlaceholder') || 'Select languages you speak'}
            data={availableLanguages}
            value={form.values.languages}
            onChange={(val) => form.setFieldValue('languages', val)}
            searchable
            clearable
          />

          {/* Skills */}
          <div>
            <Group mb="sm">
              <IconTools size={20} color="var(--mantine-color-blue-6)" />
              <Text fw={500}>{t('profile.edit.yourSkills')}</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
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
              <Stack gap="md">
                {/* Natural Building */}
                {allSkills.filter(s => s.category === 'NATB').length > 0 && (
                  <div>
                    <Group gap="xs" mb="xs">
                      <IconHome2 size={16} className="text-eco-primary" />
                      <Text size="sm" fw={600} c="dimmed">{t('projects.naturalBuilding')}</Text>
                    </Group>
                    <Grid gutter="xs">
                      {allSkills.filter(s => s.category === 'NATB').map((skill) => renderSkillCard(skill, 'blue'))}
                    </Grid>
                  </div>
                )}

                {/* Permaculture */}
                {allSkills.filter(s => s.category === 'PERM').length > 0 && (
                  <div>
                    <Group gap="xs" mb="xs">
                      <IconLeaf size={16} className="text-eco-terracotta" />
                      <Text size="sm" fw={600} c="dimmed">{t('projects.permaculture')}</Text>
                    </Group>
                    <Grid gutter="xs">
                      {allSkills.filter(s => s.category === 'PERM').map((skill) => renderSkillCard(skill, 'orange'))}
                    </Grid>
                  </div>
                )}
              </Stack>
            )}
            <Text size="sm" c="dimmed" mt="xs">
              {t('profile.edit.skillsSelected', { count: form.values.skills.length })}
            </Text>
          </div>

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={<IconDeviceFloppy size={18} />}
            >
              {t('profile.edit.saveChanges')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
