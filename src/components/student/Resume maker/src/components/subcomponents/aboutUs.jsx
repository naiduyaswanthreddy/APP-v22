import { useState, useEffect } from 'react';
import { useCache } from '../../cache/useCache';

export default function AboutUs({ edit }) {
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useCache('About Me', {
    name: 'John Doe',
    mobile: '+91 XXXXX XXXXX',
    email: 'johndoe@gmail.com',
    linkedin: 'https://linkedin.com/in/your-profile',
    github: 'https://github.com/your-username'
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
    console.log('Edit:', edit);
    if (edit === 'About Me') {
      setFormVisible(true);
    }
  }, [edit]);

  return (
    <div className="flex flex-col items-center">
      {formVisible ? (
        <form onSubmit={handleFormSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Name"
            className="border rounded px-2 py-1"
          />
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            placeholder="Mobile"
            className="border rounded px-2 py-1"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="border rounded px-2 py-1"
          />
          <input
            type="url"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleInputChange}
            placeholder="LinkedIn"
            className="border rounded px-2 py-1"
          />
          <input
            type="url"
            name="github"
            value={formData.github}
            onChange={handleInputChange}
            placeholder="GitHub"
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Save
          </button>
        </form>
      ) : (
        <>
          <h1 className="text-3xl font-bold">{formData.name}</h1>
          <div className="mt-2 flex space-x-4 text-lg">
            <span>{formData.mobile}</span>
            <span>•</span>
            <span>{formData.email}</span>
            <span>•</span>
            <a href={formData.linkedin} className="text-blue-500">LinkedIn</a>
            <span>•</span>
            <a href={formData.github} className="text-blue-500">GitHub</a>
          </div>
        </>
      )}
    </div>
  );
}
