import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Remove role state and fetchUserRole
const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingResource, setEditingResource] = useState(null);
  const [role, setRole] = useState("");
  
  const predefinedCategories = [
    "AI/ML", "Web Development", "UI/UX", "Data Analyst", "Cloud Computing", "Programming Languages"
  ];

  const fetchResources = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      const fetchedResources = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        category: Array.isArray(doc.data().category) ? doc.data().category : [doc.data().category || ''],
      }));
      setResources(fetchedResources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const addResource = async () => {
    try {
      console.log('Adding resource with:', { title, type, link, description, selectedCategories });
      
      // Validate required fields
      if (!title.trim() || !type.trim() || !link.trim() || !description.trim() || selectedCategories.length === 0) {
        console.log('Validation failed:', { 
          title: !title.trim(), 
          type: !type.trim(), 
          link: !link.trim(), 
          description: !description.trim(), 
          categories: selectedCategories.length === 0 
        });
        toast.error("All fields are required!");
        return;
      }
  
      const resourceData = {
        title: title.trim(),
        type: type.trim(),
        link: link.trim(),
        description: description.trim(),
        category: selectedCategories,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
  
      console.log('Resource data to be added:', resourceData);
  
      if (editingResource) {
        await updateDoc(doc(db, "resources", editingResource.id), resourceData);
        toast.success("Resource updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "resources"), resourceData);
        console.log('Document added with ID:', docRef.id);
        toast.success("New resource added successfully!");
      }
  
      // Reset form
      setTitle("");
      setType("");
      setLink("");
      setDescription("");
      setSelectedCategories([]);
      setEditingResource(null);
  
      // Refresh list
      await fetchResources();
    } catch (error) {
      console.error("Detailed error:", error);
      toast.error(`Operation failed: ${error.message}`);
    }
  };

  const deleteResource = async (id) => {
    try {
      await deleteDoc(doc(db, "resources", id));
      toast.success("Resource deleted successfully!");
      await fetchResources();
    } catch (error) {
      toast.error("Failed to delete resource!");
      console.error("Error:", error);
    }
  };

  const startEditing = (resource) => {
    setTitle(resource.title);
    setType(resource.type);
    setLink(resource.link);
    setDescription(resource.description);
    setSelectedCategories(resource.category || []);
    setEditingResource(resource);
    
    // Add smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !predefinedCategories.includes(newCategory.trim())) {
      setSelectedCategories([...selectedCategories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  return (
    <div className="p-0 space-y-0">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Manage Resources</h2>
          <input type="text" placeholder="Search..." className="border p-2 rounded" />
        </div>

        {/* Remove role check */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">
            {editingResource ? "Edit Resource" : "Add Resource"}
          </h3>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Type (PDF, Video, etc.)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="block w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Resource Link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="block w-full p-2 border rounded mb-2"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full p-2 border rounded mb-2"
          />
          <div className="mb-2">
            <h4 className="font-semibold">Categories</h4>
            {predefinedCategories.map((category) => (
              <label key={category} className="mr-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== category));
                    }
                  }}
                /> {category}
              </label>
            ))}
          </div>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Add new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="block w-full p-2 border rounded mb-2"
            />
            <button 
              onClick={addCategory} 
              className="px-4 py-2 bg-green-600 text-white rounded mb-2 ml-2"
            >
              Add
            </button>
          </div>
          <button 
            onClick={addResource} 
            className="px-4 py-2 bg-indigo-600 text-white rounded w-full"
          >
            {editingResource ? "Update Resource" : "Add Resource"}
          </button>
        </div>

        <div className="space-y-4">
          {resources.map((resource) => (
            <div key={resource.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{resource.title}</h3>
                <p className="text-gray-600">Type: {resource.type}</p>
                <p className="text-gray-600">
                  Categories: {Array.isArray(resource.category) ? resource.category.join(", ") : resource.category || "No categories"}
                </p>
                <p className="text-gray-500">{resource.description}</p>
              </div>
              {/* Remove role check for edit/delete buttons */}
              <div>
                <button 
                  onClick={() => startEditing(resource)} 
                  className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
                >
                  Edit
                </button>
                <button 
                  onClick={() => deleteResource(resource.id)} 
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminResources;