const CompanyCreate = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    description: '',
    website: '',
    industry: '',
    logo: '',
    permissions: {
      viewApplicants: false,
      createJobs: false,
      editJobs: false,
      viewAnalytics: false
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Store company data in Firestore
      await addDoc(collection(db, 'companies'), {
        uid: userCredential.user.uid,
        companyName: formData.companyName,
        description: formData.description,
        website: formData.website,
        industry: formData.industry,
        logo: formData.logo,
        permissions: formData.permissions,
        createdAt: serverTimestamp()
      });

      toast.success('Company account created successfully!');
    } catch (error) {
      toast.error('Error creating company account: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Company Account</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Login Credentials */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Login Credentials</h3>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Company Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Details</h3>
          <input
            type="text"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="url"
            placeholder="Website"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Industry"
            value={formData.industry}
            onChange={(e) => setFormData({...formData, industry: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Permissions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Permissions</h3>
          <div className="space-y-2">
            {Object.keys(formData.permissions).map(permission => (
              <label key={permission} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.permissions[permission]}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      [permission]: e.target.checked
                    }
                  })}
                />
                <span>{permission.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Create Company Account
        </button>
      </form>
    </div>
  );
};