import React from 'react';

const AnswersModal = ({ answers, onClose }) => {
  if (!answers || answers.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Screening Questions & Answers</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {answers.map((item, index) => (
              <div key={index} className="border-b pb-4">
                <div className="font-medium text-gray-700 mb-1">
                  Question {index + 1}: {item.question}
                </div>
                <div className="text-gray-600 pl-4 whitespace-pre-wrap">
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnswersModal;