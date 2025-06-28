import { useState, useEffect } from 'react';
import { FaGripVertical } from 'react-icons/fa';
import { useCache } from '../../cache/useCache';

export default function CustomSection({ sectionName, onEdit, onDelete }) {
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useCache(sectionName, {
    title: sectionName,
    content: 'Add your content here'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('edit', '');
    setFormVisible(false);
  };

  useEffect(() => {
    const edit = localStorage.getItem('edit');
    if (edit === sectionName) {
      setFormVisible(true);
    }
  }, [sectionName]);

  return (
    <div className="bg-white shadow p-4 mb-4 rounded">
      {formVisible ? (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Section Title"
            className="border rounded px-2 py-1 w-full font-bold text-xl"
          />
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Section Content"
            className="border rounded px-2 py-1 w-full h-32"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Save
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-start">
          <div className="cursor-pointer">
            <FaGripVertical />
          </div>
          <div className="flex-grow ml-4">
            <h1 className="text-xl font-bold">{formData.title}</h1>
            <p className="whitespace-pre-line">{formData.content}</p>
          </div>
        </div>
      )}
    </div>
  );
}