# User Settings Implementation

A complete system for storing and managing user preferences (theme, clock, stars) with Supabase integration.

## 🏗️ Database Setup

### 1. Run the SQL Script

Execute the SQL script in your Supabase dashboard:

```bash
sql/create_user_settings.sql
```

This creates:

- `user_settings` table with proper constraints
- Row Level Security (RLS) policies
- Automatic settings creation for new users
- Proper indexes for performance

### 2. Table Structure

```sql
user_settings:
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- theme_mode (TEXT: 'slate'|'day'|'night'|'midnight')
- stars_enabled (BOOLEAN, default: true)
- clock_enabled (BOOLEAN, default: true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔧 Code Architecture

### 1. Types (`src/types/userSettings.ts`)

```typescript
interface UserSettings {
  id: string;
  user_id: string;
  theme_mode: ThemeMode;
  stars_enabled: boolean;
  clock_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

### 2. Custom Hook (`src/hooks/useUserSettings.ts`)

Manages all database interactions:

- `loadSettings()` - Fetch user settings
- `updateSettings()` - Update settings in DB
- `updateTheme()` - Update theme specifically
- `updateStarsEnabled()` - Update stars setting
- `updateClockEnabled()` - Update clock setting

### 3. Enhanced Theme Hook (`src/hooks/useTheme.ts`)

Now integrates with user settings:

- **Logged in users**: Settings stored in database
- **Guest users**: Settings stored in local state
- Seamless fallback between modes

### 4. Loading Component (`src/components/SettingsLoader.tsx`)

Shows loading screen while user settings are being fetched.

## 🚀 How It Works

### For Authenticated Users:

1. User logs in
2. `useUserSettings` loads their saved preferences from database
3. If no settings exist, creates default settings
4. Theme changes automatically save to database
5. Settings persist across sessions and devices

### For Guest Users:

1. Uses local state (same as before)
2. Settings reset when page refreshes
3. No database calls made

## 📋 Usage Examples

### Update Theme Programmatically

```typescript
const { updateTheme } = useUserSettings();
updateTheme("midnight");
```

### Check if Settings are Loading

```typescript
const { settings, loading } = useUserSettings();

if (loading) {
  return <SettingsLoader />;
}
```

### Access Current Settings

```typescript
const { themeMode, nightEffectsEnabled, clockEnabled } = useNightMode();
```

## 🔒 Security Features

### Row Level Security (RLS)

- Users can only access their own settings
- Automatic user_id validation
- Secure by default

### Automatic User Setup

- New users get default settings automatically
- Triggered by database function
- No manual setup required

## 🎯 Benefits

### For Users:

- Settings persist across devices
- Seamless experience when logged in
- Instant loading of saved preferences

### For Developers:

- Clean separation of concerns
- Type-safe database operations
- Fallback for guest users
- Easy to extend with new settings

## 🔄 Data Flow

```
User Action (e.g., change theme)
     ↓
useNightMode hook
     ↓
useUserSettings hook
     ↓
Supabase Database
     ↓
Real-time UI Update
```

## 🛠️ Next Steps

The system is ready to be extended with additional settings:

- Volume preferences
- Sound library preferences
- Advanced theme customization
- Session history
- User preferences for animations

Simply add new columns to the `user_settings` table and update the TypeScript interfaces!
