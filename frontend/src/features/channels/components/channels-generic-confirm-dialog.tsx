'use client';

import { ReactNode } from 'react';
import {
  IconArchive,
  IconTrash,
  IconBan,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useChannels } from '../context/channels-context';
import {
  useUpdateChannelStatus,
  useDeleteChannel,
  useBulkArchiveChannels,
  useBulkDisableChannels,
  useBulkEnableChannels,
  useBulkDeleteChannels,
} from '../data/channels';

type ConfirmDialogType =
  | 'archive'
  | 'delete'
  | 'bulkArchive'
  | 'bulkDisable'
  | 'bulkEnable'
  | 'bulkDelete';

interface DialogConfig {
  titleKey: string;
  descKey: string;
  warningKey?: string;
  confirmKey: string;
  icon: ReactNode;
  iconColor: string;
  warningIcon?: ReactNode;
  warningBg: string;
}

const DIALOG_CONFIGS: Record<ConfirmDialogType, DialogConfig> = {
  archive: {
    titleKey: 'channels.dialogs.status.archive.title',
    descKey: 'channels.dialogs.status.archive.description',
    warningKey: 'channels.dialogs.status.archive.warning',
    confirmKey: 'common.buttons.archive',
    icon: <IconArchive className="mr-1 inline-block" size={18} />,
    iconColor: 'text-orange-600',
    warningIcon: <IconInfoCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />,
    warningBg: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
  },
  delete: {
    titleKey: 'channels.dialogs.delete.title',
    descKey: 'channels.dialogs.delete.description',
    warningKey: 'channels.dialogs.delete.warning',
    confirmKey: 'common.buttons.delete',
    icon: <IconTrash className="mr-1 inline-block" size={18} />,
    iconColor: 'text-destructive',
    warningIcon: <IconAlertTriangle className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400" />,
    warningBg: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20',
  },
  bulkArchive: {
    titleKey: 'channels.dialogs.bulkArchive.title',
    descKey: 'channels.dialogs.bulkArchive.description',
    warningKey: 'channels.dialogs.bulkArchive.warning',
    confirmKey: 'common.buttons.archive',
    icon: <IconAlertTriangle className="h-4 w-4" />,
    iconColor: 'text-destructive',
    warningIcon: <IconArchive className="mt-0.5 h-4 w-4 text-orange-600 dark:text-orange-400" />,
    warningBg: 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-900/20',
  },
  bulkDisable: {
    titleKey: 'channels.dialogs.bulkDisable.title',
    descKey: 'channels.dialogs.bulkDisable.description',
    warningKey: 'channels.dialogs.bulkDisable.warning',
    confirmKey: 'common.buttons.disable',
    icon: <IconAlertTriangle className="h-4 w-4" />,
    iconColor: 'text-destructive',
    warningIcon: <IconBan className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />,
    warningBg: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20',
  },
  bulkEnable: {
    titleKey: 'channels.dialogs.bulkEnable.title',
    descKey: 'channels.dialogs.bulkEnable.description',
    warningKey: 'channels.dialogs.bulkEnable.warning',
    confirmKey: 'common.buttons.enable',
    icon: <IconCheck className="h-4 w-4" />,
    iconColor: 'text-green-600',
    warningIcon: <IconCheck className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />,
    warningBg: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20',
  },
  bulkDelete: {
    titleKey: 'channels.dialogs.bulkDelete.title',
    descKey: 'channels.dialogs.bulkDelete.description',
    warningKey: 'channels.dialogs.bulkDelete.warning',
    confirmKey: 'common.buttons.delete',
    icon: <IconAlertTriangle className="h-4 w-4" />,
    iconColor: 'text-destructive',
    warningIcon: <IconTrash className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400" />,
    warningBg: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20',
  },
};

const CONFIRM_DIALOG_TYPES: ConfirmDialogType[] = [
  'archive',
  'delete',
  'bulkArchive',
  'bulkDisable',
  'bulkEnable',
  'bulkDelete',
];

export function ChannelsGenericConfirmDialog() {
  const { t } = useTranslation();
  const { open, setOpen, currentRow, setCurrentRow, selectedChannels, resetRowSelection, setSelectedChannels } =
    useChannels();

  // Hooks
  const updateChannelStatus = useUpdateChannelStatus();
  const deleteChannel = useDeleteChannel();
  const bulkArchive = useBulkArchiveChannels();
  const bulkDisable = useBulkDisableChannels();
  const bulkEnable = useBulkEnableChannels();
  const bulkDelete = useBulkDeleteChannels();

  const dialogType = open as ConfirmDialogType;
  if (!CONFIRM_DIALOG_TYPES.includes(dialogType)) {
    return null;
  }

  const config = DIALOG_CONFIGS[dialogType];
  const isBulk = dialogType.startsWith('bulk');
  const selectedCount = selectedChannels.length;

  // For single-row operations, require currentRow
  if (!isBulk && !currentRow) {
    return null;
  }

  const handleClose = () => {
    setOpen(null);
    if (!isBulk) {
      setTimeout(() => setCurrentRow(null), 500);
    }
  };

  const handleConfirm = async () => {
    try {
      switch (dialogType) {
        case 'archive':
          await updateChannelStatus.mutateAsync({ id: currentRow!.id, status: 'archived' });
          break;
        case 'delete':
          await deleteChannel.mutateAsync(currentRow!.id);
          break;
        case 'bulkArchive':
          await bulkArchive.mutateAsync(selectedChannels.map((c) => c.id));
          break;
        case 'bulkDisable':
          await bulkDisable.mutateAsync(selectedChannels.map((c) => c.id));
          break;
        case 'bulkEnable':
          await bulkEnable.mutateAsync(selectedChannels.map((c) => c.id));
          break;
        case 'bulkDelete':
          await bulkDelete.mutateAsync(selectedChannels.map((c) => c.id));
          break;
      }
      if (isBulk) {
        resetRowSelection();
        setSelectedChannels([]);
      }
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  const isPending =
    updateChannelStatus.isPending ||
    deleteChannel.isPending ||
    bulkArchive.isPending ||
    bulkDisable.isPending ||
    bulkEnable.isPending ||
    bulkDelete.isPending;

  const descParams = isBulk ? { count: selectedCount } : { name: currentRow?.name };

  const renderWarning = () => {
    if (!config.warningKey) return null;
    return (
      <div className={`flex items-start gap-3 rounded-md border p-3 text-sm ${config.warningBg}`}>
        {config.warningIcon}
        <div className="space-y-1 text-left">
          <p>{t(config.warningKey)}</p>
        </div>
      </div>
    );
  };

  return (
    <ConfirmDialog
      open={true}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
      handleConfirm={handleConfirm}
      disabled={isBulk ? selectedCount === 0 : false}
      isLoading={isPending}
      title={
        <span className={`flex items-center gap-2 ${config.iconColor}`}>
          {config.icon}
          {t(config.titleKey)}
        </span>
      }
      desc={t(config.descKey, descParams)}
      confirmText={t(config.confirmKey)}
      cancelBtnText={t('common.buttons.cancel')}
    >
      {renderWarning()}
    </ConfirmDialog>
  );
}
