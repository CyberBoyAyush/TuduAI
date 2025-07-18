import { Client, Account, Databases, ID, Query, OAuthProvider } from 'appwrite';

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

// Initialize services
const account = new Account(client);
const databases = new Databases(client);

// Constants - provide fallback hardcoded values
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
// Use your actual collection IDs from Appwrite dashboard
const workspacesCollectionId = import.meta.env.VITE_APPWRITE_WORKSPACES_COLLECTION_ID || 'workspaces';
const tasksCollectionId = import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID || 'tasks';
const remindersCollectionId = import.meta.env.VITE_APPWRITE_REMINDERS_COLLECTION_ID || 'reminders';

// Export initialized services and constants
export { client, account, databases, ID, Query, OAuthProvider };
export { databaseId, workspacesCollectionId, tasksCollectionId, remindersCollectionId }; 