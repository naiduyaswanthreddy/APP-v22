import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeft } from 'lucide-react';
import { createCompanyActionNotification } from '../../utils/notificationHelpers';

const SKILL_SUGGESTIONS = [
  // Programming Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Dart", "Scala", "R",
  // Frontend Technologies
  "HTML", "CSS", "React", "Angular", "Vue.js", "Svelte", "Next.js", "Bootstrap", "Tailwind",
  // Backend Technologies
  "Node.js", "Express", "Django", "Flask", "Spring", "Laravel", "ASP.NET",
  // Databases
  "MongoDB", "MySQL", "PostgreSQL", "SQLite", "Redis", "Oracle", "Firebase",
  // Other Skills
  "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "DevOps"
];

const LOCATION_SUGGESTIONS = [
  "Remote", "Hybrid", "On-site",
  "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Gurgaon", "Noida"
];

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Civil", "Chemical", "Biotechnology"
];

const CompanyJobCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  
  const [formData, setFormData] = useState({
    position: '',
    description: '',
    location: '',
    minCGPA: '7.0',
    maxCurrentArrears: '0',
    maxHistoryArrears: '0',
    eligibleBatch: [],
    eligibleDepartments: [],
    skills: [],
    deadline: '',
    screeningQuestions: []
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/company-login');
          return;
        }
        
        const companiesRef = collection(db, 'companies');
        const q = query(companiesRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          toast.error('Company data not found');
          navigate('/company-login');
          return;
        }
        
        const companyDoc = querySnapshot.docs[0];
        const companyData = {
          id: companyDoc.id,
          ...companyDoc.data()
        };
        
        // Check if company has permission to create jobs
        if (!companyData.permissions.createJobs) {
          toast.error('You do not have permission to create job postings');
          navigate('/company/dashboard');
          return;
        }
        
        setCompany(companyData);
        
        // Pre-fill company name
        setFormData(prev => ({
          ...prev,
          company: companyData.companyName
        }));
        
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast.error('Error loading company data');
        navigate('/company-login');
      }
    };
    
    fetchCompanyData();
  }, [navigate]);
  
  useEffect(() => {
    if (newSkill.trim() === '') {
      setFilteredSkills([]);
      return;
    }
    
    const filtered = SKILL_SUGGESTIONS.filter(skill =>
      skill.toLowerCase().includes(newSkill.toLowerCase()) &&
      !formData.skills.includes(skill)
    );
    
    setFilteredSkills(filtered.slice(0, 5));
  }, [newSkill, formData.skills]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          [name]: [...prev[name], value]
        };
      } else {
        return {
          ...prev,
          [name]: prev[name].filter(item => item !== value)
        };
      }
    });
  };
  
  const handleAddSkill = () => {
    if (newSkill.trim() === '') return;
    
    if (!formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
    }
    
    setNewSkill('');
    setShowSkillSuggestions(false);
  };
  
  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  const handleAddQuestion = () => {
    if (newQuestion.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      screeningQuestions: [...prev.screeningQuestions, newQuestion.trim()]
    }));
    
    setNewQuestion('');
  };
  
  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!company) {
      toast.error('Company data not found');
      return;
    }
    
    // Validate form
    if (!formData.position.trim()) {
      toast.error('Position is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (!formData.location.trim()) {
      toast.error('Location is required');
      return;
    }
    
    if (formData.eligibleBatch.length === 0) {
      toast.error('Please select at least one eligible batch');
      return;
    }
    
    if (formData.eligibleDepartments.length === 0) {
      toast.error('Please select at least one eligible department');
      return;
    }
    
    try {
      setLoading(true);
      
      // Add job to Firestore
      const jobData = {
        ...formData,
        companyId: company.id,
        postedDate: serverTimestamp(),
        status: 'pending', // Requires admin approval
        minCGPA: parseFloat(formData.minCGPA),
        maxCurrentArrears: parseInt(formData.maxCurrentArrears),
        maxHistoryArrears: parseInt(formData.maxHistoryArrears),
      };
      
      // Inside the handleSubmit function, after adding the job to Firestore:
      const docRef = await addDoc(collection(db, 'jobs'), jobData);
      
      // Create notification for admin
      await createCompanyActionNotification(
        `New Job Posting: ${formData.position} at ${company.companyName}`,
        `A new job posting requires your approval.`,
        `/admin/manage-applications`
      );
      
      toast.success('Job posting created successfully! It will be reviewed by an admin before being published.');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/company/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast.error('Error creating job posting');
    } finally {
      setLoading(false);
    }
  };
  
  if (!company) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <button
        onClick={() => navigate('/company/dashboard')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to Dashboard
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Job Posting</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position Title*</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                list="locationSuggestions"
                required
              />
              <datalist id="locationSuggestions">
                {LOCATION_SUGGESTIONS.map((location, index) => (
                  <option key={index} value={location} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description*</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA</label>
              <input
                type="number"
                name="minCGPA"
                value={formData.minCGPA}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Current Arrears</label>
              <input
                type="number"
                name="maxCurrentArrears"
                value={formData.maxCurrentArrears}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max History Arrears</label>
              <input
                type="number"
                name="maxHistoryArrears"
                value={formData.maxHistoryArrears}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Batch*</label>
              <div className="space-y-2">
                {['2023', '2024', '2025', '2026'].map(year => (
                  <label key={year} className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      name="eligibleBatch"
                      value={year}
                      checked={formData.eligibleBatch.includes(year)}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{year}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Departments*</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DEPARTMENTS.map(dept => (
                <label key={dept} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="eligibleDepartments"
                    value={dept}
                    checked={formData.eligibleDepartments.includes(dept)}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{dept}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
            <div className="flex items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    setShowSkillSuggestions(true);
                  }}
                  onFocus={() => setShowSkillSuggestions(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a skill"
                />
                {showSkillSuggestions && filteredSkills.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {filteredSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setNewSkill(skill);
                          setShowSkillSuggestions(false);
                        }}
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add
              </button>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Screening Questions</label>
            <div className="flex items-center">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a screening question"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add
              </button>
            </div>
            
            {formData.screeningQuestions.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.screeningQuestions.map((question, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <span className="text-sm">{index + 1}. {question}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/company/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Job Posting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyJobCreate;