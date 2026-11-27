import { Check, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import BaseModal from "@/modals/shared/BaseModal";
import { accentColorDescI18nKey, accentColorI18nKey } from "@/utils/theme";

interface AccentColorModalProps {
  onClose: () => void;
  onAccentColorSelect: (color: string) => void;
}

const ACCENT_COLORS = [
  { name: 'Blue', value: '#0A84FF', description: 'Classic blue' },
  { name: 'Purple', value: '#BF5AF2', description: 'Creative purple' },
  { name: 'Pink', value: '#FF2D92', description: 'Playful pink' },
  { name: 'Orange', value: '#FF9F0A', description: 'Energetic orange' },
  { name: 'Green', value: '#30D158', description: 'Fresh green' },
  { name: 'Red', value: '#FF453A', description: 'Bold red' },
  { name: 'Teal', value: '#40C0E5', description: 'Calm teal' },
  { name: 'Indigo', value: '#5E5CE6', description: 'Deep indigo' },
];

const AccentColorModal: React.FC<AccentColorModalProps> = ({ onClose, onAccentColorSelect }) => {
  const { t } = useTranslation();
  const [originalColor] = useState(() => localStorage.getItem('accentPalette') || '#0A84FF');
  const [selectedColor, setSelectedColor] = useState(originalColor);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', selectedColor);
    window.dispatchEvent(new Event('accentPaletteChange'));
    return () => {
      document.documentElement.style.setProperty('--accent-primary', localStorage.getItem('accentPalette') || originalColor);
      window.dispatchEvent(new Event('accentPaletteChange'));
    };
  }, [selectedColor, originalColor]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  return (
    // Clicks outside must not dismiss onboarding modals
    <BaseModal
      isOpen
      onClose={onClose}
      title={t('accentColors.title')}
      showHeader={false}
      closeOnOverlayClick={false}
      zIndex="z-99999"
      maxWidth="max-w-2xl"
      padding="none"
      className="overflow-hidden border-(--accent-primary)!"
    >
      <div className="relative p-4 sm:p-6 md:p-8">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-(--accent-primary)/5 via-transparent to-(--accent-primary)/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-3 sm:p-2 rounded-full bg-(--bg-secondary)/50 hover:bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) transition-all duration-100 group active:scale-95"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform duration-100" />
        </button>
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-4 sm:mb-8 relative z-10">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-(--text-primary) mb-2 sm:mb-4 text-center">
            {t('accentColors.title')}
          </h2>

          <p className="text-xs sm:text-base text-(--text-secondary) text-center leading-relaxed px-3 sm:px-0">
            {t('accentColors.subtitle')}
          </p>
        </div>

        {/* Color Options */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 relative z-10 mb-4 sm:mb-8">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              aria-pressed={selectedColor.toLowerCase() === color.value.toLowerCase()}
              className={`group relative aspect-square flex flex-col items-center justify-center p-1.5 sm:p-3 rounded-xl sm:rounded-2xl bg-(--bg-secondary)/30 border-2 transition-all duration-100 hover:shadow-lg hover:shadow-(--accent-primary)/10 active:scale-[0.98] ${
                selectedColor.toLowerCase() === color.value.toLowerCase()
                  ? 'border-(--accent-primary) bg-(--accent-primary)/10'
                  : 'border-(--border-primary)/30 hover:border-(--accent-primary)/30 hover:bg-(--bg-secondary)/50'
              }`}
            >
              {/* Color preview */}
              <div className="flex items-center justify-center mb-1.5 sm:mb-3">
                <div
                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full shadow-lg transition-transform duration-100 group-hover:scale-110"
                  style={{ backgroundColor: color.value }}
                />
              </div>

              {/* Selected indicator */}
              {selectedColor.toLowerCase() === color.value.toLowerCase() && (
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-7 sm:h-7 rounded-full bg-(--accent-primary) flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
                </div>
              )}

              {/* Color info */}
              <div className="text-center w-full">
                <h3 className="font-bold text-[10px] sm:text-sm text-(--text-primary) sm:mb-0.5 leading-tight truncate">
                  {t(accentColorI18nKey(color.name))}
                </h3>
                <p className="hidden sm:block text-[11px] leading-tight text-(--text-secondary) truncate">
                  {t(accentColorDescI18nKey(color.name))}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Skip option */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10">
          <button
            onClick={() => onAccentColorSelect(selectedColor)}
            className="rounded-xl border-2 border-(--accent-primary) px-6 py-2.5 sm:py-3 text-base sm:text-lg font-semibold text-(--accent-primary) transition-transform active:scale-[0.98]"
          >
            {t('accentColors.choose')}
          </button>
          <button
            onClick={onClose}
            className="text-xs sm:text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors duration-100"
          >
            {t('accentColors.keep')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default AccentColorModal;
