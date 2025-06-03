import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  UserCircleIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  PlusCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { sendWorkspaceInvitation } from "../lib/zohoMailer";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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
    getWorkspaceMembers,
    leaveWorkspace,
  } = useWorkspace();

  const [workspace, setWorkspace] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState([]);
  const [owner, setOwner] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [workspaceForm, setWorkspaceForm] = useState({
    name: "",
    icon: "",
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Common workspace emoji options
  const commonEmojis = [
    "📋",
    "📁",
    "📑",
    "📊",
    "🏢",
    "🔧",
    "💼",
    "📈",
    "📝",
    "✅",
    "🗓️",
    "🔍",
    "📌",
    "🏆",
    "🚀",
    "💡",
    "🌟",
    "🔔",
    "📢",
    "🧩",
    "🎯",
    "📱",
    "💻",
    "🌐",
  ];

  // Function to handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setWorkspaceForm({ ...workspaceForm, icon: emoji });
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest(".emoji-picker-container")) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // Load workspace data
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId || !currentUser) return;

      try {
        // Find the workspace in the context
        const foundWorkspace = workspaces.find((w) => w.$id === workspaceId);
        if (!foundWorkspace) {
          navigate("/todo");
          return;
        }

        setWorkspace(foundWorkspace);
        setWorkspaceForm({
          name: foundWorkspace.name || "",
          icon: foundWorkspace.icon || "📋",
        });

        // Check if user is the owner
        const ownerStatus = await isWorkspaceOwner(workspaceId);
        setIsOwner(ownerStatus);

        // Load members if the user is the owner or a member
        if (
          ownerStatus ||
          (foundWorkspace.members &&
            foundWorkspace.members.includes(currentUser.email))
        ) {
          const memberData = await getWorkspaceMembers(workspaceId);
          setMembers(memberData.members || []);

          // Use the ownerEmail from the workspace if available, otherwise use from memberData
          setOwner(foundWorkspace.ownerEmail || memberData.owner || "");
        }
      } catch (error) {
        console.error("Error loading workspace settings:", error);
        setError("Failed to load workspace settings");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [
    workspaceId,
    workspaces,
    currentUser,
    navigate,
    isWorkspaceOwner,
    getWorkspaceMembers,
  ]);

  // Handle workspace update
  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await updateWorkspace(workspaceId, {
        name: workspaceForm.name,
        icon: workspaceForm.icon,
      });
      setSuccess("Workspace updated successfully");
    } catch (error) {
      console.error("Error updating workspace:", error);
      setError(error.message || "Failed to update workspace");
    }
  };

  // Handle adding a new member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newMemberEmail) {
      setError("Please enter an email address");
      return;
    }

    try {
      await addWorkspaceMember(workspaceId, newMemberEmail);

      // Send invitation email
      try {
        await sendWorkspaceInvitation({
          recipientEmail: newMemberEmail,
          workspaceName: workspace.name,
          ownerName: currentUser.name || currentUser.email.split("@")[0],
          ownerEmail: currentUser.email,
          workspaceIcon: workspace.icon || "📋",
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the whole operation if email fails
      }

      setSuccess(`${newMemberEmail} added to workspace and invitation sent`);
      setNewMemberEmail("");

      // Refresh members list
      const memberData = await getWorkspaceMembers(workspaceId);
      setMembers(memberData.members || []);
    } catch (error) {
      console.error("Error adding member:", error);
      setError(error.message || "Failed to add member");
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (memberEmail) => {
    setError("");
    setSuccess("");

    try {
      await removeWorkspaceMember(workspaceId, memberEmail);
      setSuccess(`${memberEmail} removed from workspace`);

      // Refresh members list
      const memberData = await getWorkspaceMembers(workspaceId);
      setMembers(memberData.members || []);
    } catch (error) {
      console.error("Error removing member:", error);
      setError(error.message || "Failed to remove member");
    }
  };

  // Handle leaving a workspace
  const handleLeaveWorkspace = () => {
    setError("");
    setSuccess("");
    setShowLeaveConfirm(true);
  };

  const confirmLeaveWorkspace = async () => {
    try {
      setIsLeaving(true);
      await leaveWorkspace(workspaceId);
      setSuccess(
        "Successfully left the workspace. The owner has been notified via email."
      );
      setShowLeaveConfirm(false);

      // Navigate back to todo page after a short delay
      setTimeout(() => {
        navigate("/todo");
      }, 2000);
    } catch (error) {
      console.error("Error leaving workspace:", error);
      setError(error.message || "Failed to leave workspace");
      setShowLeaveConfirm(false);
    } finally {
      setIsLeaving(false);
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
          onClick={() => navigate("/todo")}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>{success}</span>
        </motion.div>
      )}

      <motion.div
        className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 mb-8 border border-[#d8d6cf] dark:border-[#3a3a3a] shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center mb-6">
          <div className="p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md mr-4 border border-[#d8d6cf] dark:border-[#3a3a3a]">
            <PencilSquareIcon className="w-6 h-6 text-[#f76f52]" />
          </div>
          <h2 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3]">
            Workspace Information
          </h2>
        </div>

        <form onSubmit={handleUpdateWorkspace}>
          <div className="mb-5">
            <label
              className="block text-[#202020] dark:text-[#f2f0e3] text-sm font-medium mb-2"
              htmlFor="name"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              className="shadow-sm border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md w-full py-3 px-4 text-[#202020] dark:text-[#f2f0e3] bg-[#f2f0e3] dark:bg-[#202020] focus:outline-none focus:ring-2 focus:ring-[#f76f52] focus:border-transparent transition-all placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60"
              value={workspaceForm.name}
              onChange={(e) =>
                setWorkspaceForm({ ...workspaceForm, name: e.target.value })
              }
              disabled={!isOwner}
              required
              placeholder="Enter workspace name"
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-[#202020] dark:text-[#f2f0e3] text-sm font-medium mb-2"
              htmlFor="icon"
            >
              Workspace Icon
            </label>

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-shrink-0 w-12 h-12 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md flex items-center justify-center text-2xl border border-[#d8d6cf] dark:border-[#3a3a3a]">
                  {workspaceForm.icon || "📋"}
                </div>

                <div className="flex-grow relative">
                  <input
                    id="icon"
                    type="text"
                    className="shadow-sm border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md w-full py-3 px-4 text-[#202020] dark:text-[#f2f0e3] bg-[#f2f0e3] dark:bg-[#202020] focus:outline-none focus:ring-2 focus:ring-[#f76f52] focus:border-transparent transition-all placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60"
                    value={workspaceForm.icon}
                    onChange={(e) =>
                      setWorkspaceForm({
                        ...workspaceForm,
                        icon: e.target.value,
                      })
                    }
                    disabled={!isOwner}
                    placeholder="Enter emoji or select below"
                    maxLength={2}
                  />
                </div>

                {isOwner && (
                  <motion.button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex-shrink-0 px-4 py-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md text-[#202020] dark:text-[#f2f0e3] hover:bg-[#dbd9cc] dark:hover:bg-[#333333] transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {showEmojiPicker ? "Select" : "Browse"}
                  </motion.button>
                )}
              </div>

              {/* Emoji Picker */}
              {isOwner && showEmojiPicker && (
                <motion.div
                  className="emoji-picker-container absolute z-10 left-0 right-0 mt-1 p-4 bg-[#f2f0e3] dark:bg-[#202020] rounded-md shadow-lg border border-[#d8d6cf] dark:border-[#3a3a3a]"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h4 className="text-sm font-medium text-[#3a3a3a] dark:text-[#d1cfbf] mb-3">
                    Select a workspace icon:
                  </h4>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {commonEmojis.map((emoji, index) => (
                      <motion.button
                        key={index}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className={`w-full aspect-square flex items-center justify-center text-2xl bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md hover:bg-[#dbd9cc] dark:hover:bg-[#333333] transition-colors border ${
                          workspaceForm.icon === emoji
                            ? "border-[#f76f52]"
                            : "border-[#d8d6cf] dark:border-[#3a3a3a]"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-[#3a3a3a] dark:text-[#d1cfbf] flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-[#f76f52]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    You can also type your own emoji in the text field above.
                  </div>
                </motion.div>
              )}

              {!isOwner && (
                <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] mt-2">
                  Only the workspace owner can change the icon.
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center justify-end">
              <motion.button
                type="submit"
                className="bg-[#f76f52] text-[#f2f0e3] font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f76f52] focus:ring-offset-2 focus:ring-offset-[#f2f0e3] dark:focus:ring-offset-[#202020] border border-transparent transition-all shadow-sm hover:bg-[#e55e41]"
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
          className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 mb-8 border border-[#d8d6cf] dark:border-[#3a3a3a] shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md mr-4 border border-[#d8d6cf] dark:border-[#3a3a3a]">
              <UserGroupIcon className="w-6 h-6 text-[#f76f52]" />
            </div>
            <h2 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3]">
              Workspace Collaboration
            </h2>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-[#202020] dark:text-[#f2f0e3] flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-2 text-[#3a3a3a] dark:text-[#d1cfbf]" />
              Current Members
            </h3>

            {members.length === 0 ? (
              <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md p-4 text-[#3a3a3a] dark:text-[#d1cfbf] text-center">
                No members have been added to this workspace.
              </div>
            ) : (
              <div className="border border-[#d8d6cf] dark:border-[#3a3a3a] overflow-hidden rounded-md bg-[#f2f0e3] dark:bg-[#202020]">
                <ul className="divide-y divide-[#d8d6cf] dark:divide-[#3a3a3a]">
                  {members.map((member, index) => (
                    <motion.li
                      key={index}
                      className="py-4 px-5 flex justify-between items-center hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                      <div className="flex items-center">
                        <EnvelopeIcon className="w-5 h-5 mr-3 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                        <span className="text-[#202020] dark:text-[#f2f0e3]">
                          {member}
                        </span>
                      </div>
                      <motion.button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm py-2 px-3 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
              <PlusCircleIcon className="w-5 h-5 mr-2 text-[#3a3a3a] dark:text-[#d1cfbf]" />
              Add New Member
            </h3>
            <div className="border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md p-5 bg-[#e8e6d9] dark:bg-[#2a2a2a]">
              <form onSubmit={handleAddMember}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                    <input
                      type="email"
                      className="w-full py-3 pl-10 pr-4 text-[#202020] dark:text-[#f2f0e3] bg-[#f2f0e3] dark:bg-[#202020] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#f76f52] focus:border-transparent placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60"
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    className="bg-[#f76f52] text-[#f2f0e3] font-medium py-3 px-6 rounded-md border border-transparent transition-colors shadow-sm hover:bg-[#e55e41] focus:outline-none focus:ring-2 focus:ring-[#f76f52] focus:ring-offset-2 whitespace-nowrap"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Add Member
                  </motion.button>
                </div>
                <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] mt-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-[#f76f52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  You can add up to 4 members to a workspace (5 total users
                  including yourself).
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      )}

      {/* If user is not the owner but a member */}
      {!isOwner && (
        <motion.div
          className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 border border-[#d8d6cf] dark:border-[#3a3a3a] shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md mr-4 border border-[#d8d6cf] dark:border-[#3a3a3a]">
              <UserGroupIcon className="w-6 h-6 text-[#f76f52]" />
            </div>
            <h2 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3]">
              Workspace Collaboration
            </h2>
          </div>

          <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md p-5">
            <div className="flex items-center text-[#3a3a3a] dark:text-[#d1cfbf] mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-[#f76f52]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                You are a member of this workspace. Only the workspace owner can
                manage members.
              </p>
            </div>

            {owner && (
              <div className="flex items-center mt-4 p-3 bg-[#f2f0e3] dark:bg-[#202020] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] overflow-hidden">
                <UserCircleIcon className="w-5 h-5 mr-2 text-[#3a3a3a] dark:text-[#d1cfbf] flex-shrink-0" />
                <div className="min-w-0 w-full">
                  <span className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf]">
                    Workspace owner:
                  </span>
                  <p
                    className="text-[#202020] dark:text-[#f2f0e3] font-medium truncate"
                    title={owner}
                  >
                    {owner}
                  </p>
                </div>
              </div>
            )}

            {/* Leave Workspace Button */}
            <div className="mt-6 pt-4 border-t border-[#d8d6cf] dark:border-[#3a3a3a]">
              <motion.button
                onClick={handleLeaveWorkspace}
                disabled={isLeaving}
                className="w-full px-2 md:px-4 py-1.5 md:py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                whileHover={{ scale: isLeaving ? 1 : 1.02 }}
                whileTap={{ scale: isLeaving ? 1 : 0.98 }}
              >
                {isLeaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Leaving...
                  </>
                ) : (
                  <>
                    <XMarkIcon className="w-5 h-5 mr-2" />
                    Leave Workspace
                  </>
                )}
              </motion.button>
              <p className="text-xs text-[#3a3a3a] dark:text-[#d1cfbf] mt-2 text-center">
                You will lose access to all tasks and data in this workspace.
                <br />
                The workspace owner will be notified via email.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leave Workspace Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 max-w-md w-full mx-4 shadow-xl border border-[#d8d6cf] dark:border-[#3a3a3a]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 border border-red-200 dark:border-red-800/60">
                  <XMarkIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3] mb-2">
                  Leave Workspace
                </h3>
                <p className="text-[#3a3a3a] dark:text-[#d1cfbf]">
                  Are you sure you want to leave this workspace? This action
                  cannot be undone.
                </p>
              </div>

              <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] p-4 rounded-md mb-6 border border-[#d8d6cf] dark:border-[#3a3a3a]">
                <ul className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>
                      You will lose access to all tasks and data in this
                      workspace
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>The workspace owner will be notified via email</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>You can be re-invited if needed</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="py-3 px-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] font-medium rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] hover:bg-[#dbd9cc] dark:hover:bg-[#333333] transition-colors flex-1"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={confirmLeaveWorkspace}
                  disabled={isLeaving}
                  className="py-3 px-4 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors font-medium flex-1 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  whileHover={{ scale: isLeaving ? 1 : 1.03 }}
                  whileTap={{ scale: isLeaving ? 1 : 0.97 }}
                >
                  {isLeaving ? (
                    <>
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="mr-2 animate-spin text-lg"
                        style={{ display: "inline-block" }}
                      >
                        <AiOutlineLoading3Quarters />
                      </motion.div>
                      Leaving...
                    </>
                  ) : (
                    "Leave Workspace"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
