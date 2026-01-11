import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Button,
  Group,
  Grid,
  Card,
  FileButton,
  Image,
  Badge,
  ActionIcon,
  Alert,
  List,
  SegmentedControl,
  SimpleGrid,
} from '@mantine/core';
import {
  IconCalendar,
  IconPhoto,
  IconX,
  IconSparkles,
  IconCheck,
} from '@tabler/icons-react';
import type { ProjectFormData } from '../../pages/CreateProjectPage';

interface ProjectFormStep4Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ProjectFormStep4({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: ProjectFormStep4Props) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [images, setImages] = useState<File[]>(data.images);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Get or create availability for selected year
  const getCurrentAvailability = () => {
    const existing = data.availabilities.find((a) => a.year === selectedYear);
    if (existing) return existing;

    return {
      year: selectedYear,
      january: false,
      february: false,
      march: false,
      april: false,
      may: false,
      june: false,
      july: false,
      august: false,
      september: false,
      october: false,
      november: false,
      december: false,
    };
  };

  const toggleMonth = (month: string) => {
    const currentAvail = getCurrentAvailability();
    const newAvail = { ...currentAvail, [month]: !currentAvail[month as keyof typeof currentAvail] };

    const otherYears = data.availabilities.filter((a) => a.year !== selectedYear);
    onUpdate({ availabilities: [...otherYears, newAvail] });
  };

  const handleImageUpload = (files: File[] | null) => {
    if (!files) return;

    const allImages = [...images, ...files];

    // Limit to 10 images
    if (allImages.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    setImages(allImages);
    onUpdate({ images: allImages });

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    setImages(newImages);
    setPreviewUrls(newPreviews);
    onUpdate({ images: newImages });

    // Revoke URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const availability = getCurrentAvailability();

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="md">
            Availability & Images
          </Title>
          <Text c="dimmed">
            When are you available to host volunteers? Add some photos to showcase your project.
          </Text>
        </div>

        {/* Availability Calendar */}
        <div>
          <Group mb="sm">
            <IconCalendar size={20} color="var(--mantine-color-blue-6)" />
            <Title order={3}>Availability (Optional)</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Select the months when you can host volunteers. You can skip this and add it later.
          </Text>

          {/* Year Selector */}
          <Group mb="md">
            <Text size="sm" fw={500}>
              Year:
            </Text>
            <SegmentedControl
              value={selectedYear.toString()}
              onChange={(value) => setSelectedYear(parseInt(value))}
              data={[
                { label: currentYear.toString(), value: currentYear.toString() },
                { label: (currentYear + 1).toString(), value: (currentYear + 1).toString() },
                { label: (currentYear + 2).toString(), value: (currentYear + 2).toString() },
              ]}
            />
          </Group>

          {/* Month Grid */}
          <Grid gutter="xs">
            {months.map((month, index) => {
              const isSelected = availability[month as keyof typeof availability];
              return (
                <Grid.Col key={month} span={{ base: 3, sm: 2 }}>
                  <Button
                    variant={isSelected ? 'filled' : 'default'}
                    fullWidth
                    onClick={() => toggleMonth(month)}
                    styles={{
                      root: {
                        borderWidth: 2,
                      },
                    }}
                  >
                    {monthLabels[index]}
                  </Button>
                </Grid.Col>
              );
            })}
          </Grid>

          <Text size="sm" c="dimmed" mt="xs">
            {Object.values(availability).filter((v) => v === true).length} month(s) selected for {selectedYear}
          </Text>
        </div>

        {/* Image Upload */}
        <div>
          <Group mb="sm">
            <IconPhoto size={20} color="var(--mantine-color-blue-6)" />
            <Title order={3}>Project Images (Optional)</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Add photos of your project, workspace, accommodation, and surroundings. First image will be the cover
            photo. (Max 10 images)
          </Text>

          {/* Upload Button */}
          {images.length < 10 && (
            <FileButton onChange={handleImageUpload} accept="image/*" multiple>
              {(props) => (
                <Card
                  {...props}
                  withBorder
                  padding="xl"
                  style={{
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                  }}
                >
                  <Stack align="center" gap="xs">
                    <IconPhoto size={48} color="var(--mantine-color-gray-6)" />
                    <Text fw={500}>Click to upload images</Text>
                    <Text size="xs" c="dimmed">
                      PNG, JPG up to 10MB each
                    </Text>
                  </Stack>
                </Card>
              )}
            </FileButton>
          )}

          {/* Image Previews */}
          {images.length > 0 && (
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md" mt="md">
              {images.map((image, index) => (
                <Card key={index} padding={0} withBorder style={{ position: 'relative' }}>
                  <Image
                    src={previewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    height={120}
                    fit="cover"
                  />
                  {index === 0 && (
                    <Badge
                      color="blue"
                      style={{ position: 'absolute', top: 8, left: 8 }}
                    >
                      Cover
                    </Badge>
                  )}
                  <ActionIcon
                    color="red"
                    variant="filled"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => removeImage(index)}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed" p="xs" truncate>
                    {image.name}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          )}

          <Text size="sm" c="dimmed" mt="xs">
            {images.length} / 10 images uploaded
          </Text>
        </div>

        {/* Summary */}
        <Alert color="green" title="✨ Review Your Project" icon={<IconSparkles />}>
          <List size="sm" icon={<IconCheck size={16} />}>
            <List.Item>
              <strong>{data.project_type === 'PERM' ? 'Permaculture' : 'Natural Building'}</strong> project
            </List.Item>
            <List.Item>Title: {data.title || '(not set)'}</List.Item>
            <List.Item>
              Location: {data.address.city || '(not set)'}, {data.address.country_code || '(not set)'}
            </List.Item>
            <List.Item>
              Work: {data.hours_per_day}h/day, {data.days_per_week} days/week, max {data.max_helpers} volunteers
            </List.Item>
            <List.Item>Skills: {data.skills.length} selected</List.Item>
            <List.Item>Images: {images.length} uploaded</List.Item>
          </List>
        </Alert>

        {/* Navigation */}
        <Group justify="space-between" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            variant="default"
          >
            ← Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            color="green"
            loading={isSubmitting}
            leftSection={!isSubmitting && <span>🚀</span>}
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
