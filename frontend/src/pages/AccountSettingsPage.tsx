import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Title, Text, Paper, Button, Group, Stack, ThemeIcon, Switch, Select, PasswordInput, Notification } from '@mantine/core';
import {
  IconSettings,
  IconBell,
  IconGlobe,
  IconLock,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { clearAuthTokens } from '../services/api';
import logger from '../utils/logger';

export function AccountSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    email_notifications: true,
    project_updates: true,
    message_notifications: true,
    marketing_emails: false,
    language: 'fr',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    logger.debug('Saving settings:', settings);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug('Changing password');
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAccount = () => {
    if (confirm(t('settings.deleteConfirm') || 'Are you sure you want to delete your account? This action cannot be undone.')) {
      clearAuthTokens();
      localStorage.removeItem('mock_user');
      navigate('/');
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
                    checked={settings.email_notifications}
                    onChange={(e) => setSettings({ ...settings, email_notifications: e.currentTarget.checked })}
                    color="eco-primary"
                  />
                  <Switch
                    label={t('settings.projectUpdates') || 'Project Updates'}
                    description={t('settings.projectUpdatesDesc') || "Get notified about projects you're interested in"}
                    checked={settings.project_updates}
                    onChange={(e) => setSettings({ ...settings, project_updates: e.currentTarget.checked })}
                    color="eco-primary"
                  />
                  <Switch
                    label={t('settings.messageNotifications') || 'Message Notifications'}
                    description={t('settings.messageNotificationsDesc') || 'Receive notifications for new messages'}
                    checked={settings.message_notifications}
                    onChange={(e) => setSettings({ ...settings, message_notifications: e.currentTarget.checked })}
                    color="eco-primary"
                  />
                  <Switch
                    label={t('settings.marketingEmails') || 'Marketing Emails'}
                    description={t('settings.marketingEmailsDesc') || 'Receive news and promotional content'}
                    checked={settings.marketing_emails}
                    onChange={(e) => setSettings({ ...settings, marketing_emails: e.currentTarget.checked })}
                    color="eco-primary"
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
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    radius="lg"
                  />
                  <PasswordInput
                    label={t('settings.newPassword') || 'New Password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    radius="lg"
                  />
                  <PasswordInput
                    label={t('settings.confirmPassword') || 'Confirm New Password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    radius="lg"
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
                onClick={handleDeleteAccount}
              >
                {t('settings.deleteAccount') || 'Delete Account'}
              </Button>
            </Paper>
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
