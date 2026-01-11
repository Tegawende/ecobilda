import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
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
  Select,
  FileButton,
  Avatar,
  Text,
  Skeleton,
  ThemeIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconUser,
  IconMapPin,
  IconTools,
  IconCheck,
} from '@tabler/icons-react';
import { profileService } from '../../services/profile';
import { skillsService } from '../../services/skills';
import type { User, Skill } from '../../types';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  bio: string;
  date_of_birth: Date | null;
  city: string;
  postal_code: string;
  country_code: string;
  skills: string[];
}

interface EditProfileFormProps {
  user: User;
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

export function EditProfileForm({ user, onSuccess, onCancel }: EditProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user.profile_picture || '');

  const form = useForm<ProfileFormData>({
    initialValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio || '',
      date_of_birth: user.date_of_birth ? new Date(user.date_of_birth) : null,
      city: user.address?.city || '',
      postal_code: user.address?.postal_code || '',
      country_code: (user.address?.country as any)?.code || user.address?.country || '',
      skills: user.skills?.map((s) => s.code) || [],
    },
    validate: {
      first_name: (value) => (value.length >= 2 ? null : 'First name must be at least 2 characters'),
      last_name: (value) => (value.length >= 2 ? null : 'Last name must be at least 2 characters'),
      bio: (value) => (value.length <= 1000 ? null : 'Bio must be less than 1000 characters'),
      city: (value) => (value.length >= 2 ? null : 'City is required'),
      country_code: (value) => (value.length >= 2 ? null : 'Country is required'),
    },
  });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skills = await skillsService.getSkills();
        const skillsArray = Array.isArray(skills) ? skills : (skills as any).results || [];
        setAllSkills(skillsArray);
      } catch (error) {
        console.error('Failed to fetch skills:', error);
        setAllSkills([]);
      } finally {
        setIsLoadingSkills(false);
      }
    };
    fetchSkills();
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
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

      const updateData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
        date_of_birth: data.date_of_birth
          ? `${data.date_of_birth.getFullYear()}-${String(data.date_of_birth.getMonth() + 1).padStart(2, '0')}-${String(data.date_of_birth.getDate()).padStart(2, '0')}`
          : null,
        address: {
          city: data.city,
          postal_code: data.postal_code,
          country_code: data.country_code,
        },
        skills: data.skills,
      };

      if (profilePicture) {
        updateData.profile_picture = profilePicture;
      }

      const updatedUser = await profileService.updateProfile(updateData);
      onSuccess(updatedUser);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'object'
          ? Object.values(err.response.data).flat().join(', ')
          : null) ||
        'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const countries = [
    { value: 'FR', label: 'France' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
    { value: 'PT', label: 'Portugal' },
    { value: 'DE', label: 'Germany' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'IE', label: 'Ireland' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'BE', label: 'Belgium' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'AT', label: 'Austria' },
    { value: 'GR', label: 'Greece' },
    { value: 'HR', label: 'Croatia' },
    { value: 'SE', label: 'Sweden' },
    { value: 'NO', label: 'Norway' },
  ];

  return (
    <Card withBorder shadow="sm" padding="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={2}>Edit Profile</Title>

          {error && (
            <Alert color="red" icon={<IconAlertCircle />} title="Error">
              {error}
            </Alert>
          )}

          {/* Profile Picture */}
          <div>
            <Text fw={500} mb="sm">
              Profile Picture
            </Text>
            <Group>
              <Avatar src={previewUrl} size={96} radius="xl">
                <IconUser size={48} />
              </Avatar>
              <div>
                <FileButton onChange={handleImageChange} accept="image/*">
                  {(props) => (
                    <Button {...props} variant="outline" size="sm">
                      Change Photo
                    </Button>
                  )}
                </FileButton>
                <Text size="xs" c="dimmed" mt={4}>
                  JPG, PNG up to 5MB
                </Text>
              </div>
            </Group>
          </div>

          {/* Basic Info */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="First Name *"
                {...form.getInputProps('first_name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Last Name *"
                {...form.getInputProps('last_name')}
              />
            </Grid.Col>
          </Grid>

          {/* Date of Birth */}
          <DateInput
            label="Date of Birth"
            placeholder="Select your birth date"
            {...form.getInputProps('date_of_birth')}
            maxDate={new Date()}
          />

          {/* Bio */}
          <Textarea
            label="Bio"
            placeholder="Tell us about yourself..."
            minRows={4}
            maxLength={1000}
            {...form.getInputProps('bio')}
            description={`${form.values.bio.length} / 1000 characters`}
          />

          {/* Location */}
          <div>
            <Group mb="sm">
              <IconMapPin size={20} color="var(--mantine-color-blue-6)" />
              <Text fw={500}>Location</Text>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="City *"
                  {...form.getInputProps('city')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Postal Code"
                  {...form.getInputProps('postal_code')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Select
                  label="Country *"
                  placeholder="Select your country"
                  data={countries}
                  {...form.getInputProps('country_code')}
                  searchable
                />
              </Grid.Col>
            </Grid>
          </div>

          {/* Skills */}
          <div>
            <Group mb="sm">
              <IconTools size={20} color="var(--mantine-color-blue-6)" />
              <Text fw={500}>Your Skills</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Select the skills you have or want to learn
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
              <Grid gutter="xs">
                {allSkills.map((skill) => {
                  const isSelected = form.values.skills.includes(skill.code);
                  return (
                    <Grid.Col key={skill.code} span={{ base: 6, sm: 4, md: 3 }}>
                      <Card
                        padding="sm"
                        withBorder
                        style={{
                          cursor: 'pointer',
                          borderWidth: 2,
                          borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
                          backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                        }}
                        onClick={() => toggleSkill(skill.code)}
                      >
                        <Group wrap="nowrap">
                          <Text>{skill.icon}</Text>
                          <Text size="sm" style={{ flex: 1 }}>
                            {skill.display_name_en}
                          </Text>
                          {isSelected && (
                            <ThemeIcon color="blue" variant="light" size="sm">
                              <IconCheck size={14} />
                            </ThemeIcon>
                          )}
                        </Group>
                      </Card>
                    </Grid.Col>
                  );
                })}
              </Grid>
            )}
            <Text size="sm" c="dimmed" mt="xs">
              {form.values.skills.length} skill(s) selected
            </Text>
          </div>

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={<IconDeviceFloppy size={18} />}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
