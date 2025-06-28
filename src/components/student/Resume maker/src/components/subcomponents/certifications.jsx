import React from 'react';
import { FaEdit, FaTrash, FaGripVertical } from 'react-icons/fa';

export default function Certifications({ onEdit, onDelete }) {
  return (
    <div className="flex justify-between items-center bg-white shadow p-4 mb-4 rounded">
      <div className="cursor-pointer">
        <FaGripVertical />
      </div>
      <div className="flex-grow ml-4">
        <h1 className="text-xl font-bold">Certifications</h1>
        <p>This is the Certifications section content.</p>
      </div>
    </div>
  );
}
