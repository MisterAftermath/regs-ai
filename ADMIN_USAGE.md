# Admin Usage Explorer

The admin usage explorer is a powerful tool for monitoring user activity and chat history in the application.

## Access

The admin UI is accessible at `/usage` and requires admin privileges.

## Admin Configuration

To grant admin access, update the `isAdminUser` function in `lib/utils.ts`:

```typescript
export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;

  // Define admin emails or patterns here
  const adminEmails = [
    "your-email@domain.com", // Add your admin emails here
  ];

  return false;
}
```

## Features

### User Overview

- View all registered users
- See usage statistics for each user:
  - Total chats, messages, documents, suggestions, and votes
  - Activity in the last 24 hours
  - Last active timestamp
- Filter users by email
- Guest users are clearly marked

### Detailed User Statistics

Click on any user to see:

- **Activity Overview**: Daily message trends, chat visibility breakdown
- **Document Statistics**: Types of documents created (text, code, image, spreadsheet)
- **Message Analysis**: User vs assistant message ratio, daily activity chart
- **Chat History**: Browse all user chats with direct links to view them

### Chat Viewing

- Admins can view any user's chat (both public and private)
- Chats open in read-only mode
- All features work: viewing messages, documents, artifacts, etc.

## Security

- Only users defined in the `isAdminUser` function can access the admin UI
- The system checks admin status on both frontend and backend
- Non-admin users are redirected to the home page with an error message

## Usage

1. Navigate to `/usage` while logged in as an admin
2. Browse the user list or search for specific users
3. Click on a user to see detailed statistics
4. Click "View Chat" on any chat to open it in read-only mode

## Note

This admin interface is designed for monitoring and support purposes. Always respect user privacy and use this tool responsibly.
