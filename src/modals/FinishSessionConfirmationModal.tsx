import { Check, X } from 'lucide-react';
import { Task } from './StartSessionModal';
import BaseModal from './BaseModal';

interface FinishSessionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  activeTasks: Task[];
}

const FinishSessionConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  activeTasks,
}: FinishSessionConfirmationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error finishing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Finish Session Confirmation"
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-[var(--text-primary)]">
          The following tasks will be marked as completed. Are you sure you want to continue?
        </p>
        
        <div className="max-h-60 overflow-y-auto border border-[var(--border-primary)] rounded-lg p-2">
          {activeTasks.length > 0 ? (
            <ul className="space-y-2">
              {activeTasks.map((task) => (
                <li key={task.id} className="flex items-center p-2 hover:bg-[var(--bg-secondary)] rounded">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-[var(--text-primary)]">{task.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--text-secondary)] text-center py-4">No active tasks to complete</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md border border-[var(--border-primary)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || activeTasks.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              'Finishing...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Finish
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default FinishSessionConfirmationModal;
