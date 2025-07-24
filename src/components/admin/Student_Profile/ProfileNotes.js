import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { toast } from "react-toastify";

const ProfileNotes = ({ userData, isAdminView }) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (userData) {
      setNotes(userData.notes || '');
    }
  }, [userData]);

  // Handle saving notes
  const handleSaveNotes = async () => {
    try {
      if (!userData) return;
      
      const studentId = isAdminView ? userData.id : auth.currentUser.uid;
      const studentRef = doc(db, "students", studentId);
      
      await updateDoc(studentRef, {
        notes: notes,
        updatedAt: serverTimestamp()
      });
      
      toast.success("Notes saved successfully!");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  return (
    <div className="p-0 bg-white rounded-lg shadow">
      <div className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Admin Notes</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add private notes about this student. These notes are only visible to administrators.
        </p>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Add notes about this student..."
        ></textarea>
        
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileNotes;