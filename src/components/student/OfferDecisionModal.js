import React from 'react';

const OfferDecisionModal = ({ isOpen, onClose, onConfirm, type, jobTitle, company }) => {
  if (!isOpen) return null;

  const messages = {
    accept: {
      title: "Confirm Offer Acceptance",
      message: `Are you sure you want to accept the offer for ${jobTitle} at ${company}? You will be marked as placed and may not be eligible for other jobs.`,
      confirmText: "Accept Offer",
      confirmColor: "bg-green-600 hover:bg-green-700"
    },
    reject: {
      title: "Confirm Offer Rejection",
      message: `Are you sure you want to reject the offer for ${jobTitle} at ${company}? This will be counted towards your rejection limit.`,
      confirmText: "Reject Offer",
      confirmColor: "bg-red-600 hover:bg-red-700"
    }
  };

  const currentMessage = messages[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">{currentMessage.title}</h3>
        <p className="text-gray-600 mb-6">{currentMessage.message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${currentMessage.confirmColor}`}
          >
            {currentMessage.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferDecisionModal;
