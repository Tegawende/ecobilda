import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Parse Accept-Language header to find the best matching locale
  const browserLocales = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang] = part.trim().split(';');
      return lang.split('-')[0].toLowerCase(); // "fr-FR" -> "fr"
    })
    .filter(Boolean);

  const matchedLocale = browserLocales.find((lang) =>
    routing.locales.includes(lang as typeof routing.locales[number])
  );

  redirect(`/${matchedLocale || routing.defaultLocale}`);
}
