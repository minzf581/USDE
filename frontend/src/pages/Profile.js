import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { companyAPI } from '../services/api';
import { User, Mail, Building, Save, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await companyAPI.updateProfile(formData);
      updateUser(response.data.company);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-dark">Profile</h1>
        <p className="text-secondary-dark/70">Manage your company information</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-secondary-dark">Company Information</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary flex items-center space-x-2"
          >
            {editing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            <span>{editing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-secondary-dark mb-2">
              Company Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-dark/50 w-5 h-5" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
                className="input-field pl-10 disabled:bg-secondary-light"
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-dark mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-dark/50 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                className="input-field pl-10 disabled:bg-secondary-light"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {editing && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-secondary-lighter">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Account Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Account ID</span>
              <span className="font-medium text-secondary-dark">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Member Since</span>
              <span className="font-medium text-secondary-dark">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">KYC Status</span>
              <span className={`font-medium capitalize px-2 py-1 rounded-full text-sm ${
                user?.kycStatus === 'approved' ? 'bg-green-100 text-green-700' :
                user?.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                user?.kycStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {user?.kycStatus || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 