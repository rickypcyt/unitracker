import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/modals/shared/BaseModal';
import { Habit } from '@/types/common';
import { habitFormSchema, type HabitFormValues } from '@/schemas/habit';

interface HabitEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitId: string, newName: string) => void;
  onDelete: (habitId: string) => void;
  habit: Habit | null;
}

const HabitEditModal: React.FC<HabitEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  habit
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { isValid } } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: { name: habit?.name ?? '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (habit) reset({ name: habit.name });
  }, [habit, reset]);

  const onSubmit = ({ name }: HabitFormValues) => {
    if (!habit) return;
    onSave(habit.id, name);
    onClose();
  };

  const handleDelete = () => {
    if (habit) {
      onDelete(habit.id);
      onClose();
    }
  };

  const handleClose = () => {
    reset({ name: habit?.name ?? '' });
    onClose();
  };

  if (!habit) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('habits.editTitle')}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="editHabitName"
            className="block text-sm font-medium text-(--text-primary) mb-2"
          >
            {t('habits.habitName')}
          </label>
          <input
            id="editHabitName"
            type="text"
            {...register('name')}
            placeholder={t('habits.habitNameEditPlaceholder')}
            className="w-full px-3 py-2 bg-(--bg-secondary) border-2 border-(--border-primary) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--accent-primary) text-(--text-primary) placeholder-(--text-secondary)"
            autoFocus
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border-2 border-red-500/50 px-4 py-2.5 font-semibold text-red-500 transition-colors hover:bg-red-500/10"
          >
            {t('common.delete')}
          </button>
          <div className="flex gap-3 flex-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border-2 border-(--border-primary) px-4 py-2.5 font-semibold text-(--text-primary) transition-colors hover:bg-(--bg-secondary)"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 rounded-xl border-2 border-(--accent-primary) px-4 py-2.5 font-semibold text-(--accent-primary) transition-colors hover:bg-(--accent-primary)/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

export default HabitEditModal;