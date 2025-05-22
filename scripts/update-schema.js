/**
 * Script to update Appwrite schema for workspace collaboration
 * 
 * This script adds the 'members' field to the workspaces collection
 * Run with: node scripts/update-schema.js
 */
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || ''); // Server API key with permissions

// Initialize Databases service
const databases = new Databases(client);

// Constants
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || '';
const workspacesCollectionId = process.env.VITE_APPWRITE_WORKSPACES_COLLECTION_ID || 'workspaces';

// Function to update schema
async function updateSchema() {
  try {
    console.log('Starting schema update...');
    
    // Add members array attribute to workspaces collection
    await databases.updateCollection(
      databaseId,
      workspacesCollectionId,
      undefined, // name (unchanged)
      undefined, // permissions (unchanged)
      true, // enable document creation
      true, // enable document update
      true  // enable document delete
    );
    
    // Add members attribute to workspaces collection
    await databases.createStringAttribute(
      databaseId,
      workspacesCollectionId,
      'members',
      255, // max length
      true, // array
      undefined, // default (none)
      false, // required
      true // enable index
    );
    
    console.log('Schema updated successfully!');
    console.log('Added "members" array attribute to workspaces collection');
    
  } catch (error) {
    console.error('Error updating schema:', error);
    
    // Check if error is because attribute already exists
    if (error.message && error.message.includes('already exists')) {
      console.log('The members attribute already exists in the workspaces collection.');
    }
  }
}

// Run the update
updateSchema(); 