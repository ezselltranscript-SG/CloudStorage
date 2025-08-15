# CloudStorage - Enterprise Cloud Storage Platform

## Overview

CloudStorage is a comprehensive enterprise-grade cloud storage platform that combines the simplicity of Dropbox with advanced organizational features. Built with modern web technologies including React 19, TypeScript, and Supabase, it provides a complete file management ecosystem with both user-facing features and powerful administrative capabilities.

**Key Highlights:**
- **Shared Workspace Model**: Organization-wide file access similar to Dropbox Business
- **Dual Architecture**: Separate user and admin applications with role-based access control
- **Modern Tech Stack**: React 19, TypeScript 5, Supabase, TailwindCSS, and Vite
- **Enterprise Ready**: Authentication, audit logging, analytics, and user management
- **Scalable Design**: Clean architecture with separation of concerns and modular components

## Core Features

### 🗂️ File & Folder Management
- **Hierarchical Structure**: Create nested folders with unlimited depth
- **Bulk Operations**: Upload multiple files, create folders, rename and delete operations
- **Drag & Drop**: Intuitive file uploads with visual feedback
- **File Previews**: Support for images, PDFs, and other document types
- **Search & Filter**: Real-time search across all files and folders
- **File Sharing**: Individual file sharing with toggle controls

### 🏢 Shared Workspace Model
- **Organization-wide Access**: All users see all files and folders by default (like Dropbox Business)
- **Granular Sharing**: Optional individual file/folder sharing controls
- **Visual Indicators**: Clear badges showing content shared by other users
- **Owner Permissions**: Only file/folder owners can modify their content
- **Seamless Collaboration**: No complex permission management required

### 🔐 Authentication & Security
- **Supabase Auth**: Email/password authentication with session management
- **Row Level Security**: Database-level access control
- **Role-Based Access**: Admin, Manager, and User roles with specific permissions
- **Secure Storage**: Files stored in Supabase Storage with proper access policies
- **Session Persistence**: Automatic login state management

### 👑 Admin Dashboard
- **User Management**: Create, edit, and manage user accounts
- **Role Assignment**: Assign and modify user roles and permissions
- **Analytics Dashboard**: Storage usage, user activity, and system metrics
- **Audit Logging**: Complete activity tracking for compliance
- **System Settings**: Configure platform-wide settings and preferences
- **File Management**: Admin-level file and folder oversight

### 🎨 Modern User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Themes**: Adaptive UI with user preference support
- **Toast Notifications**: Real-time feedback for all operations
- **Loading States**: Smooth loading indicators and skeleton screens
- **Context Menus**: Right-click and dropdown menus for quick actions
- **Keyboard Shortcuts**: Power user features for efficient navigation

## Technology Stack

### 🚀 Frontend Architecture
- **React 19**: Latest React with concurrent features and improved performance
- **TypeScript 5**: Full type safety with strict configuration
- **Vite 7**: Lightning-fast build tool with HMR and optimized production builds
- **React Router 7**: Client-side routing with nested routes and layouts
- **TailwindCSS 3**: Utility-first CSS with custom design system
- **Radix UI**: Headless, accessible UI primitives
- **React Query 5**: Advanced data fetching, caching, and synchronization
- **Zustand 5**: Lightweight state management for global app state
- **Lucide React**: Modern icon library with consistent design

### 🗄️ Backend & Database
- **Supabase**: Complete Backend-as-a-Service platform
  - **PostgreSQL**: Robust relational database with advanced features
  - **Row Level Security**: Database-level access control
  - **Storage**: Scalable file storage with CDN
  - **Auth**: Built-in authentication with JWT tokens
  - **Real-time**: WebSocket connections for live updates
  - **REST API**: Auto-generated APIs from database schema

### 🛠️ Development & Deployment
- **TypeScript ESLint**: Advanced linting with type-aware rules
- **PostCSS**: CSS processing with autoprefixer
- **Netlify**: Deployment platform with CI/CD
- **Git**: Version control with conventional commits
- **npm**: Package management with lock files

## 🏗️ Architecture & Project Structure

### Dual Application Architecture
The platform consists of two main applications:

1. **User Application**: File management and collaboration
2. **Admin Application**: System administration and analytics

```
src/
├── 📁 admin/                    # Admin Dashboard Module
│   ├── components/              # Admin-specific UI components
│   │   ├── common/              # Reusable admin components
│   │   ├── dashboard/           # Dashboard widgets and charts
│   │   ├── layout/              # Admin layout components
│   │   └── tables/              # Data tables for management
│   ├── context/                 # Admin-specific contexts
│   ├── hooks/                   # Admin data hooks
│   ├── pages/                   # Admin page components
│   ├── routes/                  # Admin routing configuration
│   ├── services/                # Admin data services
│   ├── types/                   # Admin TypeScript types
│   └── AdminApp.tsx             # Admin application entry
│
├── 📁 components/               # User Application Components
│   ├── auth/                    # Authentication components
│   ├── file-explorer/           # File management components
│   │   ├── FileExplorer.tsx     # Main explorer interface
│   │   ├── FileItem.tsx         # Individual file display
│   │   ├── FolderItem.tsx       # Individual folder display
│   │   ├── ShareToggleButton.tsx # Sharing control component
│   │   └── modals/              # Operation modals
│   ├── layout/                  # Application layout
│   ├── navigation/              # Navigation components
│   └── ui/                      # Reusable UI primitives
│
├── 📁 contexts/                 # Global State Management
│   ├── AuthContext.tsx          # Authentication state
│   └── ToastContext.tsx         # Notification system
│
├── 📁 hooks/                    # Custom React Hooks
│   ├── useFiles.ts              # File operations
│   ├── useFolders.ts            # Folder operations
│   └── useAuth.ts               # Authentication hooks
│
├── 📁 services/                 # Data Access Layer
│   └── supabase/                # Supabase integration
│       ├── file-service.ts      # File CRUD operations
│       ├── folder-service.ts    # Folder CRUD operations
│       └── supabase-client.ts   # Database client
│
├── 📁 routes/                   # Application Routing
│   └── AppRoutes.tsx            # Main routing configuration
│
├── 📁 types/                    # TypeScript Definitions
│   └── supabase.ts              # Database type definitions
│
└── 📁 lib/                      # Utilities & Helpers
    └── utils.ts                 # Common utility functions
```

### Clean Architecture Principles
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data
- **Dependency Inversion**: Services depend on abstractions, not implementations
- **Single Responsibility**: Each component/service has one clear purpose
- **Modular Design**: Features are self-contained and easily testable

## Core Functionality

### Services Layer

The services layer provides direct access to Supabase and handles all data operations.

#### Folder Service (`folder-service.ts`)

```typescript
export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at?: string;
}
```

- `getAllFolders()`: Retrieves all folders
- `getFoldersByParentId(parentId)`: Gets folders within a specific parent folder
- `getFolderById(id)`: Retrieves a specific folder by ID
- `createFolder(folder)`: Creates a new folder
- `updateFolder(id, folder)`: Updates an existing folder
- `deleteFolder(id)`: Deletes a folder

#### File Service (`file-service.ts`)

```typescript
export interface File {
  id: string;
  filename: string;
  folder_id: string;
  storage_path?: string;
  created_at?: string;
}
```

- `getFilesByFolderId(folderId)`: Retrieves files within a specific folder
- `uploadFile(file, fileData)`: Uploads a file to a specific folder
- `renameFile(id, newFilename)`: Renames an existing file
- `deleteFile(id, storagePath)`: Deletes a file from both database and storage
- `getFilePublicUrl(storagePath)`: Gets a public URL for a file
- `getFilePreviewUrl(storagePath)`: Gets a preview URL for supported file types
- `shareFile(id, isPublic)`: Toggles public sharing for a file

### Custom Hooks Layer

The hooks layer provides React components with access to data and operations while handling state management, caching, and optimistic updates.

#### Folder Hooks (`useFolders.ts`)

- `useAllFolders()`: Hook for retrieving all folders with React Query
- `useFoldersByParentId(parentId)`: Hook for retrieving folders by parent ID
- `useFolderById(id)`: Hook for retrieving a specific folder
- `useCreateFolder()`: Hook for creating folders with optimistic updates
- `useUpdateFolder()`: Hook for updating folders with optimistic updates
- `useDeleteFolder()`: Hook for deleting folders with optimistic updates

#### File Hooks (`useFiles.ts`, `useRenameFile.ts`, `useDeleteFile.ts`)

- `useFilesByFolderId(folderId)`: Hook for retrieving files in a folder with React Query
- `useUploadFile()`: Hook for uploading files with progress tracking
- `useRenameFile()`: Hook for renaming files with optimistic updates
- `useDeleteFile()`: Hook for deleting files with optimistic updates
- `useFilePublicUrl(storagePath)`: Hook for getting public URLs for files

#### UI Hooks

- `useOnClickOutside(ref, handler)`: Hook for detecting clicks outside an element
- `useToast()`: Hook for displaying toast notifications

Each hook properly integrates with React Query for data fetching, caching, and synchronization:

## Setup and Configuration

### Prerequisites

- Node.js 18+ and npm 9+/yarn 1.22+
- Supabase account with a project set up
- Git for version control

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Schema

The application requires the following tables in your Supabase database:

#### folders
- `id`: UUID (primary key)
- `name`: String (folder name)
- `parent_id`: UUID or null (foreign key to folders.id, null for root folders)
- `created_at`: Timestamp with time zone, default: now()
- `user_id`: UUID (prepared for future authentication implementation)

#### files
- `id`: UUID (primary key)
- `filename`: String (file name)
- `folder_id`: UUID (foreign key to folders.id)
- `storage_path`: String (path in Supabase storage)
- `created_at`: Timestamp with time zone, default: now()
- `user_id`: UUID (prepared for future authentication implementation)
- `is_public`: Boolean, default: false (for public sharing)
- `mime_type`: String (optional, for file type identification)
- `size`: Integer (optional, for file size in bytes)

### SQL Setup Script

```sql
-- Create tables
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id) NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  is_public BOOLEAN DEFAULT FALSE,
  mime_type TEXT,
  size INTEGER
);

-- Create indexes for performance
CREATE INDEX folders_parent_id_idx ON folders(parent_id);
CREATE INDEX files_folder_id_idx ON files(folder_id);
```

### Storage Buckets

Create a storage bucket named `filesclon` in your Supabase project with the following settings:

- **Public bucket**: No (files are private by default)
- **File size limit**: 50MB (or your preferred limit)
- **Allowed MIME types**: * (all types) or restrict as needed

### Storage Bucket Policy

Set up the following policy for the `filesclon` bucket to allow public access to shared files:

```sql
CREATE POLICY "Allow public access to shared files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'filesclon' AND EXISTS (
  SELECT 1 FROM files 
  WHERE storage_path = storage.objects.name 
  AND is_public = true
));
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/clondropbox.git
   cd clondropbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Preview production build:
   ```bash
   npm run preview
   ```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Run ESLint and fix issues
- `npm run typecheck`: Run TypeScript type checking

## Usage

### Creating Folders
1. Navigate to the desired parent folder
2. Click the "New Folder" button
3. Enter a folder name
4. Click "Create"

### Uploading Files
1. Navigate to the desired folder
2. Click the "Upload File" button or drag files directly into the folder area
3. Select a file from your device
4. Click "Upload"

### Managing Files and Folders
- Click the three-dot menu on any file or folder to access context menu options
- Use the context menu to rename, delete, download, or share items

### Navigating the Hierarchy
- Click on folders to navigate into them
- Use the back arrow to navigate to the parent folder

### Searching for Files and Folders
1. Use the search bar at the top of the file explorer
2. Type your search query
3. Results will filter in real-time

### Previewing Files
1. Click on a file to select it
2. Click "Preview" in the context menu
3. The file will open in a preview modal

### Sharing Files
1. Select a file
2. Click "Share" in the context menu
3. Toggle sharing on
4. Copy the generated public link
5. Share the link with others

## Roadmap and Future Enhancements

### Immediate Priorities
- ✅ File and folder CRUD operations
- ✅ Drag and drop file uploads
- ✅ File previews for images and PDFs
- ✅ File sharing via public links
- ✅ Search and filtering functionality

### Short-term Roadmap
- 🔲 User authentication with Supabase Auth
- 🔲 Row Level Security for user-specific data
- 🔲 File versioning
- 🔲 Grid/list view toggle
- 🔲 Bulk operations (select multiple files/folders)
- 🔲 Keyboard shortcuts

### Medium-term Roadmap
- 🔲 Collaborative features (shared folders)
- 🔲 File comments and annotations
- 🔲 Advanced file previews (video, audio, code)
- 🔲 File metadata extraction
- 🔲 Tagging system

### Long-term Vision
- 🔲 Migration path to AWS S3 for storage
- 🔲 Mobile applications
- 🔲 Desktop sync client
- 🔲 End-to-end encryption
- 🔲 Advanced sharing permissions
- 🔲 Team/organization features

## Architecture Decisions

### Why React + TypeScript?
React provides a component-based architecture that promotes reusability and maintainability. TypeScript adds static typing, which catches errors at compile time and improves developer experience through better tooling and documentation.

### Why Supabase?
Supabase offers a comprehensive Backend-as-a-Service solution with PostgreSQL database, storage, authentication, and real-time capabilities. This allows for rapid development without sacrificing scalability or flexibility. The application is designed to be easily migrated to other storage solutions like AWS S3 in the future.

### Why Clean Architecture?
The application follows clean architecture principles with clear separation between UI components, business logic, and data access. This makes the codebase more maintainable, testable, and adaptable to changing requirements.

## Performance Considerations

- React Query is used for efficient data fetching and caching
- Optimistic updates provide a responsive user experience
- Lazy loading of components and resources
- Efficient re-rendering with proper React hooks usage
- Tailwind's JIT compiler for optimal CSS bundle size
- Vite for fast development and optimized production builds

## Security Considerations

- Prepared for Row Level Security implementation
- File access controls through Supabase Storage policies
- Environment variables for sensitive configuration
- Type safety to prevent injection attacks
- Prepared for authentication integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [ShadcnUI](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/)
- [Zustand](https://github.com/pmndrs/zustand)

