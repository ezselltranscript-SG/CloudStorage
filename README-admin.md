# Admin Dashboard Documentation

This document provides comprehensive information about the Admin Dashboard module integrated into the Dropbox Clone application.

## Table of Contents

1. [Architecture](#architecture)
2. [Routes and Pages](#routes-and-pages)
3. [Authentication and Authorization](#authentication-and-authorization)
4. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
5. [Components and UI](#components-and-ui)
6. [Services and Data Flow](#services-and-data-flow)
7. [Extending the Admin Dashboard](#extending-the-admin-dashboard)

## Architecture

The Admin Dashboard follows a modular architecture that integrates with the main application while maintaining separation of concerns:

```
src/
├── admin/                  # Admin module root
│   ├── components/         # Admin-specific UI components
│   │   ├── common/         # Reusable admin components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── layout/         # Layout components (sidebar, topbar)
│   │   └── tables/         # Table components for data display
│   ├── context/            # Admin-specific context providers
│   ├── hooks/              # Custom hooks for admin functionality
│   ├── pages/              # Admin page components
│   ├── routes/             # Admin routing configuration
│   ├── services/           # Admin data services
│   ├── types/              # TypeScript type definitions
│   └── AdminApp.tsx        # Admin application entry point
└── ...                     # Main application files
```

The admin module is designed to be self-contained, with its own routing, state management, and UI components, while leveraging the main application's authentication and Supabase integration.

## Routes and Pages

The admin dashboard includes the following routes and pages:

| Route | Component | Description | Required Permission |
|-------|-----------|-------------|---------------------|
| `/admin/dashboard` | `DashboardPage` | Main dashboard with analytics and KPIs | `view_dashboard` |
| `/admin/users` | `UsersPage` | User management | `view_users` |
| `/admin/roles` | `RolesPage` | Role and permission management | `manage_roles` |
| `/admin/files` | `FilesPage` | File and folder management | `manage_files` |
| `/admin/audit-logs` | `AuditLogsPage` | Audit logs and activity | `view_audit_logs` |
| `/admin/settings` | `SettingsPage` | System settings | `manage_settings` |
| `/admin/access-denied` | `AccessDeniedPage` | Access denied page | None |

All routes are protected by the `ProtectedRoute` component, which checks for authentication and specific permissions.

## Authentication and Authorization

### Setting Up Authentication

1. The admin dashboard uses the same authentication system as the main application, leveraging Supabase Auth.
2. To enable authentication:
   - Ensure the Supabase project has email/password authentication enabled
   - Configure RLS (Row Level Security) policies for admin tables

### Configuring RLS Policies

For admin functionality, you need to set up the following RLS policies in Supabase:

1. Create a `user_roles` table:

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Policy for users to view their own role
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());
```

2. Create an `audit_logs` table:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all logs
CREATE POLICY "Admins can view all logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Policy for managers to view logs
CREATE POLICY "Managers can view logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'manager'
    )
  );
```

3. Create a `system_settings` table:

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage settings
CREATE POLICY "Admins can manage settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Policy for all authenticated users to view settings
CREATE POLICY "All users can view settings" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated');
```

## Role-Based Access Control (RBAC)

The admin dashboard implements RBAC through the `usePermissions` hook and related components.

### Available Roles

- **Admin**: Full access to all features
- **Manager**: Access to dashboard, user management, and file management
- **User**: Regular user with no admin access

### Available Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `view_dashboard` | Access to view the admin dashboard | Admin, Manager |
| `view_users` | Access to view user list | Admin, Manager |
| `manage_users` | Ability to create, edit, and delete users | Admin |
| `manage_roles` | Ability to manage roles and permissions | Admin |
| `manage_settings` | Ability to modify system settings | Admin |
| `view_audit_logs` | Access to view audit logs | Admin, Manager |
| `manage_files` | Ability to manage files and folders | Admin, Manager |
| `view_analytics` | Access to view analytics data | Admin, Manager |

### Extending Roles and Permissions

To add new roles or permissions:

1. Update the `Permission` and `Role` types in `src/admin/hooks/usePermissions.ts`
2. Modify the `rolePermissions` mapping to assign permissions to roles
3. Update the database schema if necessary

Example of adding a new role and permission:

```typescript
// In usePermissions.ts
export type Permission = 
  | 'view_dashboard'
  | 'view_users'
  // ... existing permissions
  | 'new_custom_permission'; // Add new permission here

export type Role = 'admin' | 'manager' | 'user' | 'new_role'; // Add new role here

// Update role-permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  admin: [ /* all permissions */ ],
  manager: [ /* manager permissions */ ],
  user: [],
  new_role: [ 'view_dashboard', 'new_custom_permission' ] // Define permissions for new role
};
```

## Components and UI

### Layout Components

- `AdminLayout`: Main layout wrapper for admin pages
- `AdminSidebar`: Navigation sidebar with links to admin pages
- `AdminTopbar`: Top navigation bar with user info and actions

### Common Components

- `StateDisplay`: Handles loading, error, and empty states
- `AdminToast`: Toast notification component
- `AdminTooltip`: Tooltip component for additional information
- `ConfirmDialog`: Confirmation dialog for important actions
- `PermissionGuard`: Component to conditionally render based on permissions

### Dashboard Components

- `DashboardOverview`: Main dashboard component
- `StatsCard`: Card component for displaying KPIs
- `StorageUsageChart`: Chart for storage usage analytics
- `UserActivityChart`: Chart for user activity analytics

### Table Components

- `UsersTable`: Table for displaying and managing users
- `RolesTable`: Table for displaying and managing roles
- `AuditLogsTable`: Table for displaying audit logs
- `FilesTable`: Table for displaying and managing files

## Services and Data Flow

The admin dashboard uses a service-based architecture for data access:

1. **Services**: Handle API calls to Supabase and data transformation
   - `UserService`: User management operations
   - `RoleService`: Role and permission operations
   - `AuditService`: Audit log operations
   - `SettingsService`: System settings operations
   - `AdminFileService`: File and folder management operations
   - `AnalyticsService`: Analytics data operations

2. **Hooks**: Provide React components with data and operations
   - `useAdminUsers`: User management hook
   - `useAdminRoles`: Role management hook
   - `useAdminAuditLogs`: Audit log hook
   - `useAdminSettings`: System settings hook
   - `useAdminFiles`: File and folder management hook
   - `useAdminAnalytics`: Analytics data hook

3. **Context Providers**: Provide global state and functionality
   - `AdminAuthContext`: Authentication state for admin
   - `AdminSettingsContext`: System settings state
   - `AdminToastContext`: Toast notification functionality

## Extending the Admin Dashboard

### Adding a New Page

1. Create a new page component in `src/admin/pages/`
2. Add the route to `src/admin/routes/AdminRoutes.tsx`
3. Add a link to the sidebar in `src/admin/components/layout/AdminSidebar.tsx`

Example of adding a new page:

```tsx
// 1. Create the page component (src/admin/pages/NewPage.tsx)
import React from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';

export const NewPage: React.FC = () => {
  return (
    <AdminLayout title="New Page" requirePermission="new_permission">
      {/* Page content */}
    </AdminLayout>
  );
};

// 2. Add the route (src/admin/routes/AdminRoutes.tsx)
<Route 
  path="/new-page" 
  element={
    <ProtectedRoute permission="new_permission">
      <NewPage />
    </ProtectedRoute>
  } 
/>

// 3. Add to sidebar (src/admin/components/layout/AdminSidebar.tsx)
// Add a new item to the navigation array
```

### Adding a New Feature

To add a new feature to the admin dashboard:

1. Define types in `src/admin/types/`
2. Create a service in `src/admin/services/`
3. Create a custom hook in `src/admin/hooks/`
4. Create UI components in `src/admin/components/`
5. Add the feature to the appropriate page

### Customizing the UI

The admin dashboard uses Tailwind CSS for styling. To customize the UI:

1. Modify the theme in `tailwind.config.js`
2. Update the components in `src/admin/components/`
3. Use the `AdminSettingsContext` to store and retrieve UI preferences

---

For any questions or issues, please contact the development team.
