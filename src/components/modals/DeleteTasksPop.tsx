import React from "react";
import { X } from "lucide-react";

interface DeleteCompletedModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteCompletedModal: React.FC<DeleteCompletedModalProps> = ({
  onClose,
  onConfirm,
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  React.useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="maincard max-w-md w-full mx-4 p-6 rounded-lg text-text-primary">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl font-bold text-center flex-1 text-red-500">
            Are you sure?
          </h3>
          <button
            className="text-gray-400 hover:text-white transition duration-200"
            onClick={onClose}
            aria-label="Close delete confirmation modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 flex flex-col items-center">
          <p className="text-lg text-center text-white">
            Are you sure you want to delete all your completed tasks?
            <br />
            <span className="text-red-400 font-semibold">
              They will be permanently deleted.
            </span>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition"
              onClick={onConfirm}
            >
              Yes, Delete All
            </button>
            <button
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded font-semibold transition"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCompletedModal;
