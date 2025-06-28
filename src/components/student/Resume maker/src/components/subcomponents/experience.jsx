import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaGripVertical } from 'react-icons/fa';
import { useCache } from '../../cache/useCache';

export default function Experience({ onEdit, onDelete }) {
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useCache('Experience', {
    experiences: [
      {
        company: 'Company Name',
        position: 'Position',
        duration: 'Duration',
        description: 'Description of your responsibilities and achievements'
      }
    ]
  });

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    const updatedExperiences = [...formData.experiences];
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [name]: value
    };
    setFormData({ ...formData, experiences: updatedExperiences });
  };

  const handleAddExperience = () => {
    setFormData({
      ...formData,
      experiences: [
        ...formData.experiences,
        {
          company: '',
          position: '',
          duration: '',
          description: ''
        }
      ]
    });
  };

  const handleRemoveExperience = (index) => {
    const updatedExperiences = [...formData.experiences];
    updatedExperiences.splice(index, 1);
    setFormData({ ...formData, experiences: updatedExperiences });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('edit', '');
    setFormVisible(false);
  };

  useEffect(() => {
    const edit = localStorage.getItem('edit');
    if (edit === 'Experience') {
      setFormVisible(true);
    }
  }, []);

  return (
    <div className="bg-white shadow p-4 mb-4 rounded">
      {formVisible ? (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <h2 className="text-xl font-bold">Experience</h2>
          
          {formData.experiences.map((exp, index) => (
            <div key={index} className="border p-4 rounded space-y-2">
              <div className="flex justify-between">
                <h3>Experience {index + 1}</h3>
                {formData.experiences.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveExperience(index)}
                    className="text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <input
                type="text"
                name="company"
                value={exp.company}
                onChange={(e) => handleInputChange(e, index)}
                placeholder="Company Name"
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                name="position"
                value={exp.position}
                onChange={(e) => handleInputChange(e, index)}
                placeholder="Position"
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                name="duration"
                value={exp.duration}
                onChange={(e) => handleInputChange(e, index)}
                placeholder="Duration (e.g., Jan 2020 - Present)"
                className="border rounded px-2 py-1 w-full"
              />
              <textarea
                name="description"
                value={exp.description}
                onChange={(e) => handleInputChange(e, index)}
                placeholder="Description of your responsibilities and achievements"
                className="border rounded px-2 py-1 w-full h-24"
              />
            </div>
          ))}
          
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={handleAddExperience}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Add Another Experience
            </button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-start">
          <div className="cursor-pointer">
            <FaGripVertical />
          </div>
          <div className="flex-grow ml-4">
            <h1 className="text-xl font-bold">Experience</h1>
            {formData.experiences.map((exp, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{exp.position} at {exp.company}</h3>
                  <span className="text-gray-600">{exp.duration}</span>
                </div>
                <p className="text-gray-700">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
