import { Link, useMatches } from '@tanstack/react-router';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Route path to i18n key mapping
const routeToI18nKey: Record<string, string> = {
  '/': 'sidebar.items.dashboard',
  '/channels': 'sidebar.items.channels',
  '/models': 'sidebar.items.models',
  '/users': 'sidebar.items.users',
  '/roles': 'sidebar.items.roles',
  '/projects': 'sidebar.items.projects',
  '/data-storages': 'sidebar.items.dataStorages',
  '/system': 'system.title',
  '/settings': 'sidebar.items.profile',
  '/project/api-keys': 'sidebar.items.apiKeys',
  '/project/prompts': 'sidebar.items.prompts',
  '/project/requests': 'sidebar.items.requests',
  '/project/traces': 'sidebar.items.traces',
  '/project/threads': 'sidebar.items.threads',
  '/project/usage-logs': 'sidebar.items.usageLogs',
  '/project/users': 'sidebar.items.users',
  '/project/roles': 'sidebar.items.roles',
  '/project/playground': 'sidebar.items.playground',
  '/project/arena': 'sidebar.items.arena',
};

// Segment to i18n key mapping for dynamic segments
const segmentToI18nKey: Record<string, string> = {
  project: 'sidebar.groups.project',
  settings: 'sidebar.groups.settings',
  system: 'system.title',
};

interface BreadcrumbSegment {
  label: string;
  href: string;
  isLast: boolean;
}

export function DynamicBreadcrumb() {
  const { t } = useTranslation();
  const matches = useMatches();

  // Build breadcrumb segments from route matches
  const segments: BreadcrumbSegment[] = [];
  const seenPaths = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const path = match.pathname;

    // Skip root and duplicate paths
    if (path === '/' || seenPaths.has(path)) continue;
    seenPaths.add(path);

    // Skip layout routes (those with _authenticated prefix in id)
    if (match.id.includes('_authenticated') && match.id !== '/_authenticated/') continue;

    // Get label from i18n mapping or generate from path
    let label: string;
    if (routeToI18nKey[path]) {
      label = t(routeToI18nKey[path]);
    } else {
      // For dynamic routes like /project/requests/$requestId
      const pathSegments = path.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];

      // Check if it's a dynamic segment (starts with $)
      if (lastSegment.startsWith('$') || /^[a-zA-Z0-9-_]+$/.test(lastSegment)) {
        // Try to get a meaningful label from the segment
        const segmentKey = segmentToI18nKey[lastSegment];
        if (segmentKey) {
          label = t(segmentKey);
        } else {
          // Use the actual value for dynamic segments (e.g., request ID)
          label = lastSegment.startsWith('$') ? lastSegment.slice(1) : lastSegment;
          // Capitalize first letter
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }
      } else {
        label = lastSegment;
      }
    }

    segments.push({
      label,
      href: path,
      isLast: i === matches.length - 1,
    });
  }

  // Don't render if only home or no segments
  if (segments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              <span className="sr-only">{t('sidebar.items.dashboard')}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment) => (
          <span key={segment.href} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {segment.isLast ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={segment.href}>{segment.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
