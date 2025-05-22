import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  UserCircleIcon, 
  PencilSquareIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  PlusCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    workspaces, 
    updateWorkspace, 
    isWorkspaceOwner,
    addWorkspaceMember,
    removeWorkspaceMember,
    getWorkspaceMembers
  } = useWorkspace();

  const [workspace, setWorkspace] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState([]);
  const [owner, setOwner] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    icon: '',
    color: ''
  });

  // Load workspace data
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId || !currentUser) return;

      try {
        // Find the workspace in the context
        const foundWorkspace = workspaces.find(w => w.$id === workspaceId);
        if (!foundWorkspace) {
          navigate('/todo');
          return;
        }

        setWorkspace(foundWorkspace);
        setWorkspaceForm({
          name: foundWorkspace.name || '',
          icon: foundWorkspace.icon || '📋',
          color: foundWorkspace.color || 'indigo'
        });

        // Check if user is the owner
        const ownerStatus = await isWorkspaceOwner(workspaceId);
        setIsOwner(ownerStatus);

        // Load members if the user is the owner or a member
        if (ownerStatus || (foundWorkspace.members && foundWorkspace.members.includes(currentUser.email))) {
          const memberData = await getWorkspaceMembers(workspaceId);
          setMembers(memberData.members || []);
          setOwner(memberData.owner || '');
        }
      } catch (error) {
        console.error('Error loading workspace settings:', error);
        setError('Failed to load workspace settings');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [workspaceId, workspaces, currentUser, navigate, isWorkspaceOwner, getWorkspaceMembers]);

  // Handle workspace update
  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateWorkspace(workspaceId, {
        name: workspaceForm.name,
        icon: workspaceForm.icon,
        color: workspaceForm.color
      });
      setSuccess('Workspace updated successfully');
    } catch (error) {
      console.error('Error updating workspace:', error);
      setError(error.message || 'Failed to update workspace');
    }
  };

  // Handle adding a new member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newMemberEmail) {
      setError('Please enter an email address');
      return;
    }

    try {
      await addWorkspaceMember(workspaceId, newMemberEmail);
      setSuccess(`${newMemberEmail} added to workspace`);
      setNewMemberEmail('');
      
      // Refresh members list
      const memberData = await getWorkspaceMembers(workspaceId);
      setMembers(memberData.members || []);
    } catch (error) {
      console.error('Error adding member:', error);
      setError(error.message || 'Failed to add member');
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (memberEmail) => {
    setError('');
    setSuccess('');

    try {
      await removeWorkspaceMember(workspaceId, memberEmail);
      setSuccess(`${memberEmail} removed from workspace`);
      
      // Refresh members list
      const memberData = await getWorkspaceMembers(workspaceId);
      setMembers(memberData.members || []);
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f76f52]"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container mx-auto px-4 py-8 font-sans">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          Workspace not found
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container max-w-4xl mx-auto px-4 py-8 font-sans"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#202020] dark:text-[#f2f0e3] flex items-center">
          <Cog6ToothIcon className="w-7 h-7 mr-2 text-[#f76f52]" />
          Workspace Settings
        </h1>
        <motion.button 
          onClick={() => navigate('/todo')}
          className="px-4 py-2 text-sm bg-[#f2f0e3] dark:bg-[#202020] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] rounded-md transition-colors border border-[#d8d6cf] dark:border-[#3a3a3a]"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Back to Tasks
        </motion.button>
      </div>

      {error && (
        <motion.div 
          className="bg-[#f2f0e3] dark:bg-[#202020] border-2 border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-6 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <XMarkIcon className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div 
          className="bg-[#f2f0e3] dark:bg-[#202020] border-2 border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md mb-6 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </motion.div>
      )}

      <motion.div 
        className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 mb-8 border border-[#d8d6cf] dark:border-[#3a3a3a]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center mb-6">
          <div className="p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md mr-4">
            <PencilSquareIcon className="w-6 h-6 text-[#f76f52]" />
          </div>
          <h2 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3]">Workspace Information</h2>
        </div>
        
        <form onSubmit={handleUpdateWorkspace}>
          <div className="mb-5">
            <label className="block text-[#202020] dark:text-[#f2f0e3] text-sm font-medium mb-2" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="shadow-sm border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md w-full py-2.5 px-4 text-[#202020] dark:text-[#f2f0e3] bg-[#f2f0e3] dark:bg-[#202020] focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent transition-all"
              value={workspaceForm.name}
              onChange={(e) => setWorkspaceForm({...workspaceForm, name: e.target.value})}
              disabled={!isOwner}
              required
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-[#202020] dark:text-[#f2f0e3] text-sm font-medium mb-2" htmlFor="icon">
              Icon
            </label>
            <input
              id="icon"
              type="text"
              className="shadow-sm border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md w-full py-2.5 px-4 text-[#202020] dark:text-[#f2f0e3] bg-[#f2f0e3] dark:bg-[#202020] focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent transition-all"
              value={workspaceForm.icon}
              onChange={(e) => setWorkspaceForm({...workspaceForm, icon: e.target.value})}
              disabled={!isOwner}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-[#202020] dark:text-[#f2f0e3] text-sm font-medium mb-2" htmlFor="color">
              Color Theme
            </label>
            <div className="relative">
              <select
                id="color"
                className="shadow-sm border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md w-full py-2.5 px-4 text-[#202020] dark:text-[#f2f0e3] bg-[#f2f0e3] dark:bg-[#202020] focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent transition-all appearance-none"
                value={workspaceForm.color}
                onChange={(e) => setWorkspaceForm({...workspaceForm, color: e.target.value})}
                disabled={!isOwner}
              >
                <option value="black">Black</option>
                <option value="gray">Gray</option>
                <option value="white">White</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#202020] dark:text-[#f2f0e3]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex items-center justify-end">
              <motion.button
                type="submit"
                className="bg-[#f76f52] text-[#f2f0e3] font-medium py-2.5 px-6 rounded-md focus:outline-none border border-transparent transition-colors shadow-sm hover:bg-[#e55e41]"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Update Workspace
              </motion.button>
            </div>
          )}
        </form>
      </motion.div>

      {/* Collaboration section - only visible to workspace owner */}
      {isOwner && !workspace.isDefault && (
        <motion.div 
          className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 mb-8 border border-[#d8d6cf] dark:border-[#3a3a3a]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md mr-4">
              <UserGroupIcon className="w-6 h-6 text-[#f76f52]" />
            </div>
            <h2 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3]">Workspace Collaboration</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-[#202020] dark:text-[#f2f0e3] flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-2" />
              Current Members
            </h3>
            
            {members.length === 0 ? (
              <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md p-4 text-[#3a3a3a] dark:text-[#d1cfbf] text-center">
                No members have been added to this workspace.
              </div>
            ) : (
              <div className="border border-[#d8d6cf] dark:border-[#3a3a3a] overflow-hidden rounded-md">
                <ul className="divide-y divide-[#d8d6cf] dark:divide-[#3a3a3a]">
                  {members.map((member, index) => (
                    <motion.li 
                      key={index} 
                      className="py-4 px-5 flex justify-between items-center hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors"
                      whileHover={{ backgroundColor: "#e8e6d9", dark: { backgroundColor: "#2a2a2a" } }}
                    >
                      <div className="flex items-center">
                        <EnvelopeIcon className="w-5 h-5 mr-3" />
                        <span className="text-[#202020] dark:text-[#f2f0e3]">{member}</span>
                      </div>
                      <motion.button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm py-1 px-3"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Remove
                      </motion.button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 text-[#202020] dark:text-[#f2f0e3] flex items-center">
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Add New Member
            </h3>
            <div className="border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md p-5">
              <form onSubmit={handleAddMember}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      className="w-full py-3 pl-10 pr-4 text-[#202020] dark:text-[#f2f0e3] bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] focus:outline-none focus:ring-1 focus:ring-[#f76f52]"
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    className="bg-[#f76f52] text-[#f2f0e3] font-medium py-3 px-6 rounded-md border border-transparent transition-colors shadow-sm hover:bg-[#e55e41] whitespace-nowrap"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Add Member
                  </motion.button>
                </div>
                <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] mt-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You can add up to 4 members to a workspace (5 total users including yourself).
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* If user is not the owner but a member */}
      {!isOwner && (
        <motion.div 
          className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 border border-[#d8d6cf] dark:border-[#3a3a3a]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md mr-4">
              <UserGroupIcon className="w-6 h-6 text-[#f76f52]" />
            </div>
            <h2 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3]">Workspace Collaboration</h2>
          </div>
          
          <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md p-5">
            <div className="flex items-center text-[#3a3a3a] dark:text-[#d1cfbf] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>You are a member of this workspace. Only the workspace owner can manage members.</p>
            </div>
            
            {owner && (
              <div className="flex items-center mt-4 p-3 bg-[#f2f0e3] dark:bg-[#202020] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]">
                <UserCircleIcon className="w-5 h-5 mr-2" />
                <div>
                  <span className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf]">Workspace owner:</span>
                  <p className="text-[#202020] dark:text-[#f2f0e3] font-medium">{owner}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}