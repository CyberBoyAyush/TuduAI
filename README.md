# TuduAI - Smart Task Management

TuduAI is an AI-powered task management application built with React.js and TailwindCSS. It uses natural language processing to understand task descriptions, due dates, and priorities.

![TuduAI Screenshot](https://placeholder-for-screenshot.com)

## Features

- **AI-Powered Task Parsing**: Type tasks in natural language like "Learn JavaScript tomorrow at 7PM" and TuduAI will understand
- **Smart Task Organization**: Automatically categorizes tasks as Today & Overdue, Next 7 Days, or Upcoming
- **User Accounts**: Local authentication with secure storage
- **Dark/Light Mode**: Beautiful UI that adapts to your preference
- **Comment System**: Add notes and reminders to your tasks
- **Special Commands**: Use `!remindme` and `!help` in comments for extra functionality

## Technology Stack

- React.js with Vite
- TailwindCSS v4.1
- Framer Motion for animations
- OpenAI GPT-4.1 Mini integration
- Appwrite for backend services and authentication
- LocalStorage for data persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm installed

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/tuduai.git
cd tuduai
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Create a `.env` file in the root and add your Appwrite configuration:
```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
VITE_APPWRITE_WORKSPACES_COLLECTION_ID=your-workspaces-collection-id
VITE_APPWRITE_TASKS_COLLECTION_ID=your-tasks-collection-id
VITE_APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection-id
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

4. Set up Appwrite:
   - Create an Appwrite account at [https://appwrite.io/](https://appwrite.io/)
   - Create a new project and database
   - Create the following collections with these schemas:

```
• workspaces:
  - id         (String, 36, Required)
  - name       (String, 50, Required)
  - icon       (String, 4, Required)
  - color      (String, 20, Required)
  - userId     (String, 36, Required)
  - isDefault  (Boolean, Required, default=false)

• tasks:
  - id           (String, 36, Required)
  - title        (String,100, Required)
  - dueDate      (String ISO, Required)
  - urgency      (Double, Required)
  - completed    (Boolean, Required, default=false)
  - createdAt    (String ISO, Required)
  - updatedAt    (String ISO, Required)
  - workspaceId  (String,36, Required)
  - userId       (String,36, Required)
  - comments     (String[], Optional)

• reminders:
  - id           (String,36, Required)
  - text         (String,200, Required)
  - dueDate      (String ISO, Required)
  - taskId       (String,36, Required)
  - taskTitle    (String,100, Required)
  - workspaceId  (String,36, Required)
  - userId       (String,36, Required)
  - userEmail    (Email, Required)
  - userName     (String,100, Required)
  - createdAt    (String ISO, Required)
  - status       (String,10, Required, enum: "pending","done")
```

5. Start the development server
```bash
npm run dev
# or
pnpm dev
```

6. Open http://localhost:5173 in your browser

## Usage

### Creating Tasks

Type your task in natural language in the input field:
- "Learn JavaScript tomorrow at 7PM"
- "Doctor appointment on May 25th at 10AM urgency 4"
- "Buy groceries today"

### Task Management

- Tasks are automatically organized into columns
- Click on a task to expand and add comments
- Use checkboxes to mark tasks as complete
- Delete tasks using the trash icon

### Comment Commands

- `!remindme` - Sets a reminder for the task
- `!help` - Shows available commands

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by agenda.dev
- Icons from Heroicons
- Built with Vite and React
