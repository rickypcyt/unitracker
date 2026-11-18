import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/modals/shared/BaseModal';
import { habitFormSchema, type HabitFormValues } from '@/schemas/habit';

interface HabitCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: { name: string }) => void;
}

const HabitCreateModal: React.FC<HabitCreateModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { isValid } } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: { name: '' },
    mode: 'onChange',
  });

  const onSubmit = ({ name }: HabitFormValues) => {
    onAdd({ name });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('habits.createTitle')}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="habitName"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            {t('habits.habitName')}
          </label>
          <input
            id="habitName"
            type="text"
            {...register('name')}
            placeholder={t('habits.habitNamePlaceholder')}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            autoFocus
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-md text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {t('common.cancel')}
          </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 px-4 py-2 bg-transparent border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {t('habits.create')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default HabitCreateModal;