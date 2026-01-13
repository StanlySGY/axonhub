import { Link, useLocation } from '@tanstack/react-router';
import {
  IconLayoutDashboard,
  IconAi,
  IconActivity,
  IconUserCog,
  IconDotsVertical,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSearch } from '@/context/search-context';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  matchPaths?: string[];
}

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setOpen } = useSearch();

  const navItems: NavItem[] = [
    {
      icon: IconLayoutDashboard,
      label: t('sidebar.items.dashboard'),
      href: '/',
      matchPaths: ['/'],
    },
    {
      icon: IconAi,
      label: t('sidebar.items.channels'),
      href: '/channels',
      matchPaths: ['/channels'],
    },
    {
      icon: IconActivity,
      label: t('sidebar.items.requests'),
      href: '/project/requests',
      matchPaths: ['/project/requests', '/project/traces', '/project/threads'],
    },
    {
      icon: IconUserCog,
      label: t('sidebar.items.profile'),
      href: '/settings',
      matchPaths: ['/settings'],
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some((path) => {
        if (path === '/') {
          return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
      });
    }
    return location.pathname === item.href;
  };

  return (
    <nav className='bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur md:hidden'>
      <div className='flex h-16 items-center justify-around px-2'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className='h-5 w-5' />
              <span className='text-[10px] font-medium'>{item.label}</span>
            </Link>
          );
        })}
        {/* More button to open command menu */}
        <button
          onClick={() => setOpen(true)}
          className='text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors'
        >
          <IconDotsVertical className='h-5 w-5' />
          <span className='text-[10px] font-medium'>{t('common.more')}</span>
        </button>
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className='h-safe-area-inset-bottom bg-background' />
    </nav>
  );
}
