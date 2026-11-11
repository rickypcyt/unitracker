import { Bell, BellOff, MousePointerClick } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import BaseModal from '@/modals/shared/BaseModal';
import { useNotificationPromptStore } from '@/store/notificationPromptStore';
import { getDesktopPermission } from '@/utils/desktopNotifications';

const NotificationPromptModal = () => {
  const { t } = useTranslation();
  const { isOpen, close } = useNotificationPromptStore();
  // When the browser has hard-blocked us, the only fix is the site settings UI.
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) setShowHelp(getDesktopPermission() === 'denied');
  }, [isOpen]);

  const handleEnable = async () => {
    if (getDesktopPermission() === 'denied') {
      setShowHelp(true);
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        toast.success(t('notifications.enabled'));
        close();
      } else {
        setShowHelp(true);
      }
    } catch {
      setShowHelp(true);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={close} title={t('notifications.title')}>
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
          <Bell size={28} className="text-[var(--accent-primary)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {t('notifications.description')}
        </p>

        {showHelp && (
          <div className="w-full mt-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-left">
            <div className="flex items-center gap-2 mb-2 text-[var(--text-primary)]">
              <BellOff size={16} />
              <span className="text-sm font-semibold">{t('notifications.blockedTitle')}</span>
            </div>
            <ol className="text-sm text-[var(--text-secondary)] space-y-1.5 list-decimal list-inside">
              <li className="flex items-start gap-1.5">
                <MousePointerClick size={15} className="mt-0.5 shrink-0" />
                <span>{t('notifications.step1')}</span>
              </li>
              <li><Trans i18nKey="notifications.step2" components={{ strong: <strong /> }} /></li>
              <li><Trans i18nKey="notifications.step3" components={{ strong: <strong /> }} /></li>
              <li>{t('notifications.step4')}</li>
            </ol>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={close}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          {t('notifications.notNow')}
        </button>
        {!showHelp && (
          <button
            type="button"
            onClick={handleEnable}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold bg-[var(--accent-primary)] text-white hover:opacity-90 transition-colors"
          >
            {t('notifications.title')}
          </button>
        )}
      </div>
    </BaseModal>
  );
};

export default NotificationPromptModal;
