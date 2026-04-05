'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Container, Title, Text, Paper, Button, Group, Stack, ThemeIcon, Switch, Select, TextInput, PasswordInput, Notification, Alert, Modal } from '@mantine/core';
import {
  IconSettings,
  IconBell,
  IconGlobe,
  IconLock,
  IconTrash,
  IconCheck,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { clearSessionToken } from '@/lib/convexClient';
import logger from '@/lib/logger';

export function SettingsClient() {
  const t = useTranslations();
  const router = useRouter();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    projectUpdates: true,
    messageNotifications: true,
    marketingEmails: false,
    language: 'fr',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    logger.debug('Saving settings:', settings);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug('Changing password');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const deleteConfirmWord = t('settings.deleteConfirmWord') || 'DELETE';

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      // TODO: Call API to delete account
      clearSessionToken();
      localStorage.removeItem('mock_user');
      setDeleteModalOpen(false);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'de', label: 'Deutsch' },
  ];

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="sm">
          {/* Header */}
          <Group gap="md" mb="xl">
            <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
              <IconSettings size={28} />
            </ThemeIcon>
            <Stack gap={4}>
              <Title order={1} className="font-display">
                {t('settings.title') || 'Account Settings'}
              </Title>
              <Text c="dimmed">
                {t('settings.subtitle') || 'Manage your preferences and security'}
              </Text>
            </Stack>
          </Group>

          {/* Success Toast */}
          {saveSuccess && (
            <Notification
              icon={<IconCheck size={18} />}
              color="eco-primary"
              title={t('settings.saved') || 'Settings saved!'}
              onClose={() => setSaveSuccess(false)}
              mb="lg"
              withCloseButton
            />
          )}

          <Stack gap="lg">
            {/* Notifications */}
            <Paper radius="lg" p="lg" withBorder>
              <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                <IconBell size={24} className="text-eco-primary" />
                <Title order={4} className="font-display">
                  {t('settings.notifications') || 'Notifications'}
                </Title>
              </Group>

              <form onSubmit={handleSaveSettings}>
                <Stack gap="md">
                  <Switch
                    label={t('settings.emailNotifications') || 'Email Notifications'}
                    description={t('settings.emailNotificationsDesc') || 'Receive email notifications for important updates'}
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.currentTarget.checked })}
                    color="eco-primary"
                    styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                  <Switch
                    label={t('settings.projectUpdates') || 'Project Updates'}
                    description={t('settings.projectUpdatesDesc') || "Get notified about projects you're interested in"}
                    checked={settings.projectUpdates}
                    onChange={(e) => setSettings({ ...settings, projectUpdates: e.currentTarget.checked })}
                    color="eco-primary"
                    styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                  <Switch
                    label={t('settings.messageNotifications') || 'Message Notifications'}
                    description={t('settings.messageNotificationsDesc') || 'Receive notifications for new messages'}
                    checked={settings.messageNotifications}
                    onChange={(e) => setSettings({ ...settings, messageNotifications: e.currentTarget.checked })}
                    color="eco-primary"
                    styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                  <Switch
                    label={t('settings.marketingEmails') || 'Marketing Emails'}
                    description={t('settings.marketingEmailsDesc') || 'Receive news and promotional content'}
                    checked={settings.marketingEmails}
                    onChange={(e) => setSettings({ ...settings, marketingEmails: e.currentTarget.checked })}
                    color="eco-primary"
                    styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                </Stack>

                <Group justify="flex-end" mt="lg">
                  <Button type="submit" radius="xl" color="eco-primary">
                    {t('settings.saveChanges') || 'Save Changes'}
                  </Button>
                </Group>
              </form>
            </Paper>

            {/* Language */}
            <Paper radius="lg" p="lg" withBorder>
              <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                <IconGlobe size={24} className="text-eco-primary" />
                <Title order={4} className="font-display">
                  {t('settings.language') || 'Language'}
                </Title>
              </Group>

              <form onSubmit={handleSaveSettings}>
                <Select
                  label={t('settings.preferredLanguage') || 'Preferred Language'}
                  value={settings.language}
                  onChange={(val) => setSettings({ ...settings, language: val || 'fr' })}
                  data={languageOptions}
                  radius="lg"
                />
                <Group justify="flex-end" mt="lg">
                  <Button type="submit" radius="xl" color="eco-primary">
                    {t('settings.saveLanguage') || 'Save Language'}
                  </Button>
                </Group>
              </form>
            </Paper>

            {/* Change Password */}
            <Paper radius="lg" p="lg" withBorder>
              <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                <IconLock size={24} className="text-eco-primary" />
                <Title order={4} className="font-display">
                  {t('settings.changePassword') || 'Change Password'}
                </Title>
              </Group>

              <form onSubmit={handleChangePassword}>
                <Stack gap="md">
                  <PasswordInput
                    label={t('settings.currentPassword') || 'Current Password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    radius="lg"
                    visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  />
                  <PasswordInput
                    label={t('settings.newPassword') || 'New Password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    radius="lg"
                    visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  />
                  <PasswordInput
                    label={t('settings.confirmPassword') || 'Confirm New Password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    radius="lg"
                    visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  />
                </Stack>
                <Group justify="flex-end" mt="lg">
                  <Button type="submit" radius="xl" color="eco-primary">
                    {t('settings.updatePassword') || 'Update Password'}
                  </Button>
                </Group>
              </form>
            </Paper>

            {/* Danger Zone */}
            <Paper radius="lg" p="lg" withBorder className="border-2 border-red-200">
              <Group gap="sm" mb="md">
                <IconTrash size={24} className="text-red-500" />
                <Title order={4} c="red" className="font-display">
                  {t('settings.dangerZone') || 'Danger Zone'}
                </Title>
              </Group>
              <Text c="dimmed" mb="md">
                {t('settings.deleteWarning') || 'Once you delete your account, there is no going back. Please be certain.'}
              </Text>
              <Button
                variant="outline"
                color="red"
                radius="xl"
                onClick={() => setDeleteModalOpen(true)}
              >
                {t('settings.deleteAccount') || 'Delete Account'}
              </Button>
            </Paper>

            {/* Delete Account Confirmation Modal */}
            <Modal
              opened={deleteModalOpen}
              onClose={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}
              title={t('settings.deleteAccount') || 'Delete Account'}
              centered
            >
              <Stack gap="md">
                <Alert color="red" variant="light">
                  {t('settings.deleteConfirm') || 'Are you sure you want to delete your account? This action cannot be undone.'}
                </Alert>
                <Text size="sm">
                  {t('settings.deleteConfirmInstruction') || `Type "${deleteConfirmWord}" to confirm:`}
                </Text>
                <TextInput
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteConfirmWord}
                />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}>
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                  <Button
                    color="red"
                    onClick={handleDeleteAccount}
                    loading={isDeleting}
                    disabled={deleteConfirmText !== deleteConfirmWord}
                  >
                    {t('settings.deleteAccount') || 'Delete Account'}
                  </Button>
                </Group>
              </Stack>
            </Modal>
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
