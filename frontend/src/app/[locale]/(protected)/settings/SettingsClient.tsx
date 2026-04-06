'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/providers/AuthProvider';
import { profileService } from '@/services/profile';
import { authService } from '@/services/auth';
import { clearSessionToken } from '@/lib/convexClient';
import logger from '@/lib/logger';

export function SettingsClient() {
  const t = useTranslations();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    newsletter: false,
    inAppNotifications: true,
    notificationLanguage: 'en',
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
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSettings({
        emailNotifications: user.emailNotifications ?? true,
        newsletter: user.newsletter ?? false,
        inAppNotifications: user.inAppNotifications ?? true,
        notificationLanguage: user.notificationLanguage ?? 'en',
      });
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavingSettings(true);
    try {
      await profileService.updateSettings(settings);
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t('errors.generic.description'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavingSettings(true);
    try {
      await profileService.updateSettings({ notificationLanguage: settings.notificationLanguage });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t('errors.generic.description'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('settings.passwordTooShort'));
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || t('errors.generic.description'));
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteConfirmWord = t('settings.deleteConfirmWord');

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      // TODO: Call API to delete account
      clearSessionToken();
      localStorage.removeItem('mock_user');
      setDeleteModalOpen(false);
      router.push('/');
    } catch (err: any) {
      setError(err.message || t('errors.generic.description'));
    } finally {
      setIsDeleting(false);
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'de', label: 'Deutsch' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'pt', label: 'Português' },
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
                {t('settings.title')}
              </Title>
              <Text c="dimmed">
                {t('settings.subtitle')}
              </Text>
            </Stack>
          </Group>

          {/* Success Toast */}
          {saveSuccess && (
            <Notification
              icon={<IconCheck size={18} />}
              color="eco-primary"
              title={t('settings.saved')}
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
                  {t('settings.notifications')}
                </Title>
              </Group>

              <form onSubmit={handleSaveSettings}>
                <Stack gap="md">
                  <Switch
                    label={t('settings.emailNotifications')}
                    description={t('settings.emailNotificationsDesc')}
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.currentTarget.checked })}
                    color="eco-primary"
                    styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                  <Switch
                    label={t('settings.inAppNotifications')}
                    description={t('settings.inAppNotificationsDesc')}
                    checked={settings.inAppNotifications}
                    onChange={(e) => setSettings({ ...settings, inAppNotifications: e.currentTarget.checked })}
                    color="eco-primary"
                    styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                  <Switch
                    label={t('settings.newsletter')}
                    description={t('settings.newsletterDesc')}
                    checked={settings.newsletter}
                    onChange={(e) => setSettings({ ...settings, newsletter: e.currentTarget.checked })}
                    color="eco-primary"
                    styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                </Stack>

                <Group justify="flex-end" mt="lg">
                  <Button type="submit" radius="xl" color="eco-primary" loading={savingSettings}>
                    {t('settings.saveChanges')}
                  </Button>
                </Group>
              </form>
            </Paper>

            {/* Language */}
            <Paper radius="lg" p="lg" withBorder>
              <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                <IconGlobe size={24} className="text-eco-primary" />
                <Title order={4} className="font-display">
                  {t('settings.language')}
                </Title>
              </Group>

              <form onSubmit={handleSaveLanguage}>
                <Select
                  label={t('settings.preferredLanguage')}
                  value={settings.notificationLanguage}
                  onChange={(val) => setSettings({ ...settings, notificationLanguage: val || 'en' })}
                  data={languageOptions}
                  radius="lg"
                />
                <Group justify="flex-end" mt="lg">
                  <Button type="submit" radius="xl" color="eco-primary" loading={savingSettings}>
                    {t('settings.saveLanguage')}
                  </Button>
                </Group>
              </form>
            </Paper>

            {/* Change Password (only for password-based accounts) */}
            {user?.hasPassword !== false && (
              <Paper radius="lg" p="lg" withBorder>
                <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                  <IconLock size={24} className="text-eco-primary" />
                  <Title order={4} className="font-display">
                    {t('settings.changePassword')}
                  </Title>
                </Group>

                {passwordError && (
                  <Alert color="red" variant="light" mb="md">
                    {passwordError}
                  </Alert>
                )}

                <form onSubmit={handleChangePassword}>
                  <Stack gap="md">
                    <PasswordInput
                      label={t('settings.currentPassword')}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      radius="lg"
                      required
                      visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    />
                    <PasswordInput
                      label={t('settings.newPassword')}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      radius="lg"
                      required
                      visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    />
                    <PasswordInput
                      label={t('settings.confirmPassword')}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      radius="lg"
                      required
                      visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    />
                  </Stack>
                  <Group justify="flex-end" mt="lg">
                    <Button type="submit" radius="xl" color="eco-primary" loading={savingPassword}>
                      {t('settings.updatePassword')}
                    </Button>
                  </Group>
                </form>
              </Paper>
            )}

            {/* Danger Zone */}
            <Paper radius="lg" p="lg" withBorder className="border-2 border-red-200">
              <Group gap="sm" mb="md">
                <IconTrash size={24} className="text-red-500" />
                <Title order={4} c="red" className="font-display">
                  {t('settings.dangerZone')}
                </Title>
              </Group>
              <Text c="dimmed" mb="md">
                {t('settings.deleteWarning')}
              </Text>
              <Button
                variant="outline"
                color="red"
                radius="xl"
                onClick={() => setDeleteModalOpen(true)}
              >
                {t('settings.deleteAccount')}
              </Button>
            </Paper>

            {/* Delete Account Confirmation Modal */}
            <Modal
              opened={deleteModalOpen}
              onClose={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}
              title={t('settings.deleteAccount')}
              centered
            >
              <Stack gap="md">
                <Alert color="red" variant="light">
                  {t('settings.deleteConfirm')}
                </Alert>
                <Text size="sm">
                  {t('settings.deleteConfirmInstruction')}
                </Text>
                <TextInput
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteConfirmWord}
                />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    color="red"
                    onClick={handleDeleteAccount}
                    loading={isDeleting}
                    disabled={deleteConfirmText !== deleteConfirmWord}
                  >
                    {t('settings.deleteAccount')}
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
