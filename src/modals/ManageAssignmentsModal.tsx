import { AppDispatch, RootState } from '@/store/store';
import React, { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import BaseModal from '@/modals/BaseModal';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import { Task } from '@/pages/tasks/taskStorage';
import { deleteTask } from '@/store/TaskActions';

interface ManageAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageAssignmentsModal: React.FC<ManageAssignmentsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [assignments, setAssignments] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Get unique assignments from tasks
    const uniqueAssignments = [...new Set(tasks.map((task: Task) => task.assignment || 'No Assignment'))]
      .filter((assignment): assignment is string => assignment !== 'No Assignment')
      .sort();
    setAssignments(uniqueAssignments);
  }, [tasks]);

  const handleDeleteAssignment = (assignment: string) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const confirmDeleteAssignment = () => {
    if (!assignmentToDelete) return;

    // Delete all tasks associated with this assignment
    const tasksToDelete = tasks.filter((task: Task) => task.assignment === assignmentToDelete);
    tasksToDelete.forEach((task: Task) => {
      dispatch(deleteTask(task.id));
    });

    setShowDeleteModal(false);
    setAssignmentToDelete(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Assignments"
        maxWidth="max-w-2xl"
        className="!p-0"
      >
        <div className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
          {assignments.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-4">
              No assignments found
            </p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment, idx) => (
                <div
                  key={assignment}
                  className={`flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg ${idx !== assignments.length - 1 ? 'border-b border-[var(--border-primary)]' : ''}`}
                >
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">
                      {assignment}
                    </h3>
                    <p className="text-base text-[var(--text-secondary)]">
                      {tasks.filter((task: Task) => task.assignment === assignment).length} tasks
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAssignment(assignment)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete assignment and all its tasks"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </BaseModal>

      {showDeleteModal && assignmentToDelete && (
        <DeleteCompletedModal
          onClose={() => {
            setShowDeleteModal(false);
            setAssignmentToDelete(null);
          }}
          onConfirm={confirmDeleteAssignment}
          message={`Are you sure you want to delete the assignment "${assignmentToDelete}"? All tasks associated with this assignment will be deleted.`}
          confirmButtonText="Delete Assignment"
        />
      )}
    </>
  );
};

export default ManageAssignmentsModal; 