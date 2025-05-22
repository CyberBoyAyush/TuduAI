import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Workspace not found
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Cog6ToothIcon className="w-7 h-7 mr-2 text-indigo-500" />
          Workspace Settings
        </h1>
        <button 
          onClick={() => navigate('/todo')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
        >
          Back to Tasks
        </button>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
          <XMarkIcon className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl p-6 mb-8 border border-gray-200 dark:border-neutral-700">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-4">
            <PencilSquareIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workspace Information</h2>
        </div>
        
        <form onSubmit={handleUpdateWorkspace}>
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="shadow-sm border border-gray-300 dark:border-neutral-600 rounded-lg w-full py-2.5 px-4 text-gray-700 dark:text-gray-200 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={workspaceForm.name}
              onChange={(e) => setWorkspaceForm({...workspaceForm, name: e.target.value})}
              disabled={!isOwner}
              required
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="icon">
              Icon
            </label>
            <input
              id="icon"
              type="text"
              className="shadow-sm border border-gray-300 dark:border-neutral-600 rounded-lg w-full py-2.5 px-4 text-gray-700 dark:text-gray-200 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={workspaceForm.icon}
              onChange={(e) => setWorkspaceForm({...workspaceForm, icon: e.target.value})}
              disabled={!isOwner}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="color">
              Color Theme
            </label>
            <div className="relative">
              <select
                id="color"
                className="shadow-sm border border-gray-300 dark:border-neutral-600 rounded-lg w-full py-2.5 px-4 text-gray-700 dark:text-gray-200 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                value={workspaceForm.color}
                onChange={(e) => setWorkspaceForm({...workspaceForm, color: e.target.value})}
                disabled={!isOwner}
              >
                <option value="indigo">Indigo</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="red">Red</option>
                <option value="yellow">Yellow</option>
                <option value="purple">Purple</option>
                <option value="pink">Pink</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
              >
                Update Workspace
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Collaboration section - only visible to workspace owner */}
      {isOwner && !workspace.isDefault && (
        <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl p-6 mb-8 border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
              <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workspace Collaboration</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
              Current Members
            </h3>
            
            {members.length === 0 ? (
              <div className="bg-gray-50 dark:bg-neutral-850 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 text-gray-600 dark:text-gray-400 text-center">
                No members have been added to this workspace.
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {members.map((member, index) => (
                    <li key={index} className="py-4 px-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors">
                      <div className="flex items-center">
                        <EnvelopeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                        <span className="text-gray-800 dark:text-gray-200">{member}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm py-1 px-3"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <PlusCircleIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
              Add New Member
            </h3>
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-5">
              <form onSubmit={handleAddMember}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      className="w-full py-3 pl-10 pr-4 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-neutral-700 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm whitespace-nowrap"
                  >
                    Add Member
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You can add up to 4 members to a workspace (5 total users including yourself).
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* If user is not the owner but a member */}
      {!isOwner && (
        <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
              <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workspace Collaboration</h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-neutral-850 border border-gray-200 dark:border-neutral-700 rounded-lg p-5">
            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>You are a member of this workspace. Only the workspace owner can manage members.</p>
            </div>
            
            {owner && (
              <div className="flex items-center mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <UserCircleIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Workspace owner:</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{owner}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 