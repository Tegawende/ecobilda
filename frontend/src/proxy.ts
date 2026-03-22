import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match root
    '/',
    // Match locale-prefixed paths
    '/(fr|en|es|de|nl|pt)/:path*',
    // Match paths without locale (proxy will add locale prefix)
    '/((?!api|_next|_vercel|images|favicon\\.ico|.*\\..*).*)',
  ],
};
