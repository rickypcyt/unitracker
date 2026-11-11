import BaseModal from '@/modals/shared/BaseModal';
import { useTranslation } from 'react-i18next';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  const { t } = useTranslation();
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.about.title')}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{t('settings.about.theStory')}</h3>
          <p className="text-base text-[var(--text-secondary)]">
            {t('settings.about.storyBody')}
          </p>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{t('settings.about.aboutMe')}</h3>
          <p className="text-base text-[var(--text-secondary)]">
            {t('settings.about.aboutMeBody')}
          </p>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{t('settings.about.getInTouch')}</h3>
          <p className="text-base text-[var(--text-secondary)] mb-2">
            {t('settings.about.getInTouchBody')}
          </p>
            <a 
            href="mailto:info@unitracker.me" 
            className="flex items-center gap-2 text-[var(--accent-primary)] text-base font-medium hover:underline"
            >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.876 1.797l-7.5 5.625a2.25 2.25 0 01-2.748 0l-7.5-5.625A2.25 2.25 0 012.25 6.993V6.75" />
            </svg>
              info@unitracker.me
            </a>
        </div>
        
        <div className="border-t border-[var(--border-primary)] pt-4 text-center text-[var(--text-secondary)] pb-2">
            {t('settings.about.thankYou')}
        </div>
      </div>
    </BaseModal>
  );
};

export default AboutModal; 