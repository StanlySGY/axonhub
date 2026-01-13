import { Link } from '@tanstack/react-router';
import { IconSearch, IconSettings } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSearch } from '@/context/search-context';
import { LanguageSwitch } from '@/components/language-switch';
import { PermissionGuard } from '@/components/permission-guard';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { useBrandSettings } from '@/features/system/data/system';
import { DynamicBreadcrumb } from './dynamic-breadcrumb';
import { ProjectSwitcher } from './project-switcher';

export function AppHeader() {
  const { t } = useTranslation();
  const { setOpen } = useSearch();
  const { data: brandSettings } = useBrandSettings();
  const displayName = brandSettings?.brandName || 'AxonHub';
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 w-full backdrop-blur'>
      <div className='flex h-14 items-center justify-between'>
        {/* Logo + Project Switcher - 左侧对齐 */}
        <div className='flex items-center gap-2 pl-6'>
          {/* Sidebar Toggle - 与侧边栏图标垂直对齐 */}
          <SidebarTrigger className='-ml-4 size-8' />

          {/* Logo */}
          <div className='flex items-center gap-2'>
            <div className='flex size-8 shrink-0 items-center justify-center overflow-hidden rounded'>
              {brandSettings?.brandLogo ? (
                <img
                  src={brandSettings.brandLogo}
                  alt='Brand Logo'
                  width={24}
                  height={24}
                  className='size-8 object-cover'
                  onError={(e) => {
                    e.currentTarget.src = '/logo.jpg';
                  }}
                />
              ) : (
                <img src='/logo.jpg' alt='Default Logo' width={24} height={24} className='size-8 object-cover' />
              )}
            </div>
            <span className='text-sm leading-none font-semibold'>{displayName}</span>
          </div>

          {/* Separator */}
          <div className='bg-border mx-0.5 h-3.5 w-px' />

          {/* Project Switcher */}
          <ProjectSwitcher />

          {/* Separator */}
          <div className='bg-border mx-0.5 h-3.5 w-px hidden md:block' />

          {/* Breadcrumb Navigation - Hidden on mobile */}
          <div className='hidden md:block'>
            <DynamicBreadcrumb />
          </div>
        </div>

        {/* 右侧控件 */}
        <div className='flex items-center gap-2 pr-6'>
          {/* Command Menu Trigger */}
          <Button
            variant='outline'
            className='text-muted-foreground relative h-8 w-full justify-start rounded-md text-sm font-normal shadow-none sm:pr-12 md:w-40 lg:w-56'
            onClick={() => setOpen(true)}
          >
            <IconSearch className='mr-2 h-4 w-4' />
            <span className='hidden lg:inline-flex'>{t('command.placeholder')}</span>
            <span className='inline-flex lg:hidden'>{t('common.search')}</span>
            <kbd className='bg-muted pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
              <span className='text-xs'>{isMac ? '⌘' : 'Ctrl'}</span>K
            </kbd>
          </Button>
          <PermissionGuard requiredSystemScope='read_system'>
            <Link to='/system'>
              <Button variant='ghost' size='icon' className='size-8'>
                <IconSettings className='h-4 w-4' />
              </Button>
            </Link>
          </PermissionGuard>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
