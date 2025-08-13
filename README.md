# ClonDropbox - Modern Cloud Storage Solution

## Overview

ClonDropbox is a sophisticated web application that provides Dropbox-like file storage functionality with a modern, intuitive interface. Built with React, TypeScript, and Supabase, it offers comprehensive file and folder management capabilities in the cloud. The application follows clean architecture principles and is designed to be maintainable, scalable, and ready for enterprise use.

This project demonstrates best practices in modern web development, including:
- Component-based architecture with React
- Type safety with TypeScript
- Clean separation of concerns (presentation, business logic, data access)
- Optimized state management with React Query and Zustand
- Responsive design with TailwindCSS
- Backend-as-a-Service integration with Supabase
- Modern build tooling with Vite

## Features

### Folder Management
- **Create Folders**: Create new folders in the root directory or within other folders
- **Rename Folders**: Easily rename existing folders
- **Delete Folders**: Remove folders and their contents
- **Navigate Folders**: Browse through hierarchical folder structure
- **View Folders**: Display folders with intuitive UI elements

### File Management
- **Upload Files**: Upload files to the root directory or specific folders
- **Rename Files**: Change file names as needed
- **Delete Files**: Remove files from storage
- **Download Files**: Download files to your local device
- **View Files**: Display files with appropriate icons based on file type
- **Preview Files**: Preview images, PDFs and other supported formats directly in the browser
- **Share Files**: Generate and manage public sharing links for files
- **Drag & Drop**: Intuitive drag and drop interface for file uploads

### User Interface
- **Modern UI**: Clean, responsive interface built with TailwindCSS and ShadcnUI
- **Context Menus**: Context menus (three dots) for quick actions on files and folders
- **Modal Dialogs**: User-friendly modal dialogs for operations like create, rename, delete, and share
- **Toast Notifications**: Visual feedback for operations with success/error messages
- **Loading States**: Visual indicators during loading operations
- **Empty States**: Informative empty states when folders contain no items
- **Search Functionality**: Real-time search and filtering of files and folders
- **Responsive Design**: Fully responsive layout that works on all device sizes

### Technical Features
- **Real-time Updates**: Changes reflect immediately across the interface using React Query
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Type Safety**: Full TypeScript integration with generated Supabase types
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Clean Architecture**: Strict separation of concerns with services, hooks, and components
- **Optimistic Updates**: UI updates immediately before server confirmation for a snappy feel
- **Lazy Loading**: Components and resources load only when needed
- **Modular Design**: Highly modular code structure for maintainability and testability
- **Extensible Framework**: Built to easily accommodate future features like authentication

## Technology Stack

### Frontend
- **React 18**: UI library for building component-based interfaces
- **TypeScript 5**: Type-safe JavaScript for better developer experience and code quality
- **Vite 5**: Fast, modern build tool for development with HMR (Hot Module Replacement)
- **TailwindCSS 4**: Utility-first CSS framework for styling with JIT (Just-In-Time) compiler
- **ShadcnUI**: Unstyled, accessible UI component library built on Radix UI
- **React Query 5**: Data fetching, caching, state management with automatic background refetching
- **Zustand 4**: Lightweight state management with a simple API
- **Lucide Icons**: Beautiful, consistent icon set
- **PostCSS**: Advanced CSS processing for optimal production builds

### Backend
- **Supabase**: Backend-as-a-Service platform providing:
  - **PostgreSQL Database**: For storing file and folder metadata with RLS (Row Level Security)
  - **Storage**: For storing actual file content with bucket policies
  - **REST API**: For interacting with the database and storage
  - **Real-time subscriptions**: For live updates (prepared for future implementation)
  - **Auth**: Authentication system (prepared for future implementation)

### Development Tools
- **ESLint**: JavaScript and TypeScript linting
- **TypeScript**: Static type checking
- **npm**: Package management
- **Git**: Version control

## Project Structure

```
src/
├── components/         # UI components
│   ├── file-explorer/  # File explorer components
│   │   ├── FileExplorer.tsx       # Main file explorer component
│   │   ├── FileItem.tsx           # Individual file item component
│   │   ├── FolderItem.tsx         # Individual folder item component
│   │   ├── NewFolderModal.tsx     # Modal for creating new folders
│   │   ├── RenameFolderModal.tsx  # Modal for renaming folders
│   │   ├── DeleteFolderModal.tsx  # Modal for deleting folders
│   │   ├── UploadFileModal.tsx    # Modal for uploading files
│   │   ├── RenameFileModal.tsx    # Modal for renaming files
│   │   ├── DeleteFileModal.tsx    # Modal for deleting files
│   │   ├── FilePreviewModal.tsx   # Modal for previewing files
│   │   ├── ShareFileModal.tsx     # Modal for sharing files
│   │   └── SearchBar.tsx          # Search component for filtering
│   ├── layout/         # Layout components
│   │   ├── MainLayout.tsx         # Main application layout
│   │   └── Sidebar.tsx            # Sidebar navigation component
│   └── ui/             # Reusable UI components
│       ├── Button.tsx             # Button component
│       ├── Dialog.tsx             # Dialog/modal component
│       ├── Input.tsx              # Input component
│       ├── Label.tsx              # Form label component
│       └── Toast.tsx              # Toast notification component
├── hooks/              # Custom React hooks
│   ├── useFiles.ts              # Hooks for file operations
│   ├── useFolders.ts            # Hooks for folder operations
│   ├── useOnClickOutside.ts     # Utility hook for UI interactions
│   ├── useRenameFile.ts         # Hook for renaming files
│   ├── useDeleteFile.ts         # Hook for deleting files
│   ├── useFilePublicUrl.ts      # Hook for getting public file URLs
│   └── useToast.ts              # Hook for toast notifications
├── services/           # Service layer
│   └── supabase/       # Supabase integration
│       ├── file-service.ts      # File operations service
│       ├── folder-service.ts    # Folder operations service
│       └── supabase-client.ts   # Supabase client configuration
├── types/              # TypeScript type definitions
│   ├── supabase.ts             # Supabase database types
│   └── *.d.ts                  # Type declaration files
├── lib/                # Utility libraries
│   └── utils/          # Utility functions
│       └── cn.ts                # Class name utility for Tailwind
├── contexts/           # React contexts
│   └── ToastContext.tsx        # Context for toast notifications
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

This structure follows a clean architecture approach with clear separation of concerns:

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

