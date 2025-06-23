import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Import setDoc
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GitHubCalendar from "react-github-calendar"; // Import GitHubCalendar

const Profile = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    mobile: "",
    rollNumber: "",
    batch: "",
    program: "",
    department: "",
    passoutYear: "",
    github: "",
    leetcode: "",
    hackerrank: "",
    cgpa: "",
    skills: "",
    academicInfo: "",
    currentArrears: "0",
    historyOfArrears: "0",
    backlogsCleared: "No",
    projects: []
  });
  const [resumeLink, setResumeLink] = useState(""); // Define resumeLink as a separate state
  const [isEditingResume, setIsEditingResume] = useState(false); // State to toggle resume editing
  const [githubUsername, setGithubUsername] = useState(""); // Define githubUsername state
  const [showHeatmap, setShowHeatmap] = useState(false); // Define showHeatmap state

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      const studentRef = doc(db, "students", user.uid);
      const studentSnap = await getDoc(studentRef);
      
      setUserData(prev => ({
        ...prev,
        name: user.displayName || "User",
        email: user.email,
        mobile: localStorage.getItem("mobile") || "",
        rollNumber: localStorage.getItem("rollNumber") || "",
        batch: localStorage.getItem("batch") || "",
        program: localStorage.getItem("program") || "",
        department: studentSnap.exists() ? studentSnap.data().department || "" : "",
        github: localStorage.getItem("github") || "",
        leetcode: localStorage.getItem("leetcode") || "",
        hackerrank: localStorage.getItem("hackerrank") || "",
        cgpa: studentSnap.exists() ? studentSnap.data().cgpa || "" : "",
        skills: studentSnap.exists() ? studentSnap.data().skills || "" : "",
        academicInfo: studentSnap.exists() ? studentSnap.data().academicInfo || "" : "",
        currentArrears: studentSnap.exists() ? studentSnap.data().currentArrears || "0" : "0",
        historyOfArrears: studentSnap.exists() ? studentSnap.data().historyOfArrears || "0" : "0",
        backlogsCleared: studentSnap.exists() ? studentSnap.data().backlogsCleared || "No" : "No",
        projects: studentSnap.exists() ? studentSnap.data().projects || [] : []
      }));

      if (studentSnap.exists()) {
        setResumeLink(studentSnap.data().resumeLink || ""); // Set resumeLink separately
      }
    }
  };

  const handleGitHubClick = () => {
    const username = prompt("Please enter your GitHub username:");
    if (username) {
      setGithubUsername(username);
      setShowHeatmap(true);
    }
  };

  const handleSaveAcademicDetails = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const studentRef = doc(db, "students", user.uid);
        await setDoc(studentRef, {
          cgpa: userData.cgpa,
          skills: userData.skills,
          academicInfo: userData.academicInfo,
          currentArrears: userData.currentArrears,
          historyOfArrears: userData.historyOfArrears,
          backlogsCleared: userData.backlogsCleared,
          projects: userData.projects
        }, { merge: true });
        toast.success("Academic details updated successfully!");
      } catch (error) {
        console.error("Error updating academic details: ", error);
        toast.error("Failed to update academic details. Please try again.");
      }
    } else {
      toast.error("User not authenticated. Please log in.");
    }
  };

  const handleUploadResume = async () => {
    const link = prompt("Please enter the link to your resume:");
    if (link) {
      const user = auth.currentUser;
      if (user) {
        try {
          const studentRef = doc(db, "students", user.uid);
          await setDoc(studentRef, { resumeLink: link }, { merge: true }); // Store resumeLink in Firestore
          setResumeLink(link); // Update resumeLink state
          toast.success("Resume link added successfully!");
        } catch (error) {
          console.error("Error saving resume link: ", error);
          toast.error("Failed to save resume link. Please try again.");
        }
      } else {
        toast.error("User not authenticated. Please log in.");
      }
    }
  };

  const handleSaveResumeLink = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const studentRef = doc(db, "students", user.uid);
        await setDoc(studentRef, { resumeLink }, { merge: true }); // Store resumeLink in Firestore
        toast.success("Resume link updated successfully!");
        setIsEditingResume(false); // Exit editing mode
      } catch (error) {
        console.error("Error updating resume link: ", error);
        toast.error("Failed to update resume link. Please try again.");
      }
    } else {
      toast.error("User not authenticated. Please log in.");
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="bg-white rounded-lg shadow-lg p-6 flex items-center space-x-6">
        <img
          src="profile_picture_url" // Replace with actual profile picture URL
          alt="Profile"
          className="w-24 h-24 rounded-full"
        />
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-lg font-semibold">{userData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Batch</p>
              <p className="text-lg font-semibold">{userData.batch}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Roll No</p>
              <p className="text-lg font-semibold">{userData.rollNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Program</p>
              <p className="text-lg font-semibold">{userData.program}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Degree</p>
              <p className="text-lg font-semibold">{userData.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Mobile</p>
              <p className="text-lg font-semibold">{userData.mobile}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">CGPA</p>
              <input
                type="text"
                value={userData.cgpa}
                onChange={(e) => setUserData({ ...userData, cgpa: e.target.value })}
                className="px-4 py-2 border rounded-md"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Current Arrears</p>
              <input
                type="number"
                value={userData.currentArrears}
                onChange={(e) => setUserData({ ...userData, currentArrears: e.target.value })}
                className="px-4 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">History of Arrears</p>
              <input
                type="number"
                value={userData.historyOfArrears}
                onChange={(e) => setUserData({ ...userData, historyOfArrears: e.target.value })}
                className="px-4 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Backlogs Cleared</p>
              <select
                value={userData.backlogsCleared}
                onChange={(e) => setUserData({ ...userData, backlogsCleared: e.target.value })}
                className="px-4 py-2 border rounded-md w-full"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-500">Skills (comma-separated)</p>
              <input
                type="text"
                value={userData.skills}
                onChange={(e) => setUserData({ ...userData, skills: e.target.value })}
                className="px-4 py-2 border rounded-md w-full"
                placeholder="Python, React, Node.js"
              />
            </div>

            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-500">Projects</p>
              {userData.projects.map((project, index) => (
                <div key={index} className="mb-4 p-4 border rounded-md">
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => {
                      const newProjects = [...userData.projects];
                      newProjects[index] = { ...project, title: e.target.value };
                      setUserData({ ...userData, projects: newProjects });
                    }}
                    className="px-4 py-2 border rounded-md w-full mb-2"
                    placeholder="Project Title"
                  />
                  <input
                    type="text"
                    value={project.techStack.join(', ')}
                    onChange={(e) => {
                      const newProjects = [...userData.projects];
                      newProjects[index] = { 
                        ...project, 
                        techStack: e.target.value.split(',').map(tech => tech.trim()) 
                      };
                      setUserData({ ...userData, projects: newProjects });
                    }}
                    className="px-4 py-2 border rounded-md w-full mb-2"
                    placeholder="Tech Stack (comma-separated)"
                  />
                  <input
                    type="text"
                    value={project.description}
                    onChange={(e) => {
                      const newProjects = [...userData.projects];
                      newProjects[index] = { ...project, description: e.target.value };
                      setUserData({ ...userData, projects: newProjects });
                    }}
                    className="px-4 py-2 border rounded-md w-full mb-2"
                    placeholder="Project Description"
                  />
                  <input
                    type="url"
                    value={project.projectUrl}
                    onChange={(e) => {
                      const newProjects = [...userData.projects];
                      newProjects[index] = { ...project, projectUrl: e.target.value };
                      setUserData({ ...userData, projects: newProjects });
                    }}
                    className="px-4 py-2 border rounded-md w-full"
                    placeholder="Project URL"
                  />
                </div>
              ))}
              <button
                onClick={() => setUserData({
                  ...userData,
                  projects: [...userData.projects, {
                    title: '',
                    techStack: [],
                    description: '',
                    projectUrl: ''
                  }]
                })}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Project
              </button>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <a href={`mailto:${userData.email}`} className="text-blue-500">
              📧 {userData.email}
            </a>
            <a href={userData.github} className="text-blue-500">
              GitHub
            </a>
            <a href={userData.leetcode} className="text-blue-500">
              LeetCode
            </a>
            <a href={userData.hackerrank} className="text-blue-500">
              HackerRank
            </a>
          </div>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6 flex justify-center items-center">
          <button
            className="px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300"
            onClick={handleGitHubClick}
          >
            <i className="fab fa-github"></i> GitHub Profile
          </button>
          {showHeatmap && (
            <GitHubCalendar username={githubUsername} />
          )}
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 flex justify-center items-center">
          <button className="px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300">
            <i className="fas fa-code"></i> LeetCode Profile
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mt-6 flex justify-center items-center space-x-4">
        <button className="px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300">
          <i className="fas fa-file-alt"></i> Create Resume
        </button>
        {resumeLink ? (
          <div className="flex items-center space-x-2">
            {isEditingResume ? (
              <>
                <input
                  type="text"
                  value={resumeLink}
                  onChange={(e) => setResumeLink(e.target.value)}
                  className="px-4 py-2 border rounded-md"
                />
                <button
                  className="px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300"
                  onClick={handleSaveResumeLink}
                >
                  <i className="fas fa-save"></i> Save
                </button>
              </>
            ) : (
              <>
                <a
                  href={resumeLink}
                  className="px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-eye"></i> View Resume
                </a>
                <button
                  className="px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300"
                  onClick={() => setIsEditingResume(true)}
                >
                  <i className="fas fa-edit"></i> Edit Resume
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter resume link"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
              className="px-4 py-2 border rounded-md"
            />
            <button
              className="px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300"
              onClick={handleUploadResume}
            >
              <i className="fas fa-upload"></i> Upload Resume
            </button>
          </div>
        )}
      </div>

      {/* Save Academic Details Button */}
      <div className="mt-6 flex justify-center">
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          onClick={handleSaveAcademicDetails}
        >
          Save Academic Details
        </button>
      </div>
    </div>
  );
};

export default Profile;
