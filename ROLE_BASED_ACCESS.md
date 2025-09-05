# Role-Based Access Control (RBAC) System

This document explains how the role-based access control system works in the Golf Tee Times app.

## User Roles

The app supports three user roles:

### 1. Admin

- **Access**: All screens except guest-specific screens
- **Screens Available**:
  - Admin Dashboard
  - Interest Form
  - Member Dashboard
  - Trades
  - User Role Management
- **Capabilities**:
  - View all app data
  - Manage user roles
  - Access administrative functions
  - View and manage trades

### 2. Member

- **Access**: Interest form and member dashboard
- **Screens Available**:
  - Interest Form
  - Member Dashboard
- **Capabilities**:
  - Submit interest forms
  - View member-specific information
  - Access member dashboard

### 3. Guest

- **Access**: Guest schedule only
- **Screens Available**:
  - Guest Schedule
- **Capabilities**:
  - View public tee time schedules
  - Limited access to app features

## Implementation Details

### Database Schema

- User profiles are stored in the `profiles` table
- Each user has a `role` field with values: 'admin', 'member', or 'guest'
- The `is_admin` boolean field is maintained for backward compatibility
- New users automatically get 'guest' role by default

### Authentication & Authorization

- User authentication is handled by Supabase Auth
- User profiles are automatically created when users sign up
- Role information is fetched and cached in the `useAuth` hook
- Navigation is dynamically generated based on user roles

### Role Guards

- Each screen is wrapped with a `RoleGuard` component
- The `RoleGuard` checks if the current user has permission to access the screen
- If access is denied, users see an "Access Denied" message
- Role checks happen at the component level for security

### Navigation Structure

- **AdminTabs**: Full navigation with all admin features
- **MemberTabs**: Limited navigation for members
- **GuestTabs**: Minimal navigation for guests
- Navigation automatically switches based on user role

## Security Features

1. **Client-side Protection**: Role checks prevent unauthorized UI access
2. **Database Policies**: Row-level security policies in Supabase
3. **Role Validation**: Server-side validation of user permissions
4. **Automatic Role Assignment**: New users get appropriate default roles

## Managing User Roles

### For Admins

- Access the "Users" tab in the admin navigation
- View all users and their current roles
- Change user roles with confirmation dialogs
- Cannot change their own role (security measure)

### For Developers

- Roles are stored in the `profiles` table
- Update roles via Supabase dashboard or API calls
- Role changes take effect immediately
- Users are automatically redirected to appropriate navigation

## Adding New Screens

When adding new screens, follow these steps:

1. **Wrap with RoleGuard**: Protect the screen with appropriate role permissions
2. **Update Navigation**: Add to the appropriate tab navigator
3. **Set Permissions**: Define which roles can access the screen
4. **Test Access**: Verify role-based access works correctly

Example:

```tsx
<RoleGuard allowedRoles={["admin", "member"]}>
  <NewScreen />
</RoleGuard>
```

## Troubleshooting

### Common Issues

- **Screen not showing**: Check if user has the required role
- **Navigation issues**: Verify user profile is loaded correctly
- **Access denied**: Ensure user role is properly set in database

### Debug Steps

1. Check user profile in `useAuth` hook
2. Verify role in Supabase profiles table
3. Check RoleGuard component permissions
4. Ensure navigation is properly configured

## Future Enhancements

- **Role Hierarchy**: Implement role inheritance
- **Permission Granularity**: Fine-grained permissions per feature
- **Audit Logging**: Track role changes and access attempts
- **Dynamic Permissions**: Runtime permission updates
