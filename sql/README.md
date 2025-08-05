# SQL Database Schema Files

This directory contains all SQL schema files and database setup scripts for the Mesmer application.

## 🗄️ **Schema Files:**

### **Core Application:**

- `sound_presets_schema.sql` - Complete preset system (presets, preset_sounds tables, RLS policies)
- `sounds_schema.sql` - User-uploaded custom sounds table and storage
- `builtin_sounds_setup.sql` - Built-in sounds table and initial data

### **User Settings:**

- `create_user_settings.sql` - User settings table with RLS policies and triggers
- `create_user_settings_simple.sql` - Simplified version of user settings setup

### **Database Setup:**

- `database-setup.sql` - Complete database initialization script
- `quick-database-setup.sql` - Quick setup for development environments

### **Fixes and Updates:**

- `fix_preset_schema.sql` - Fixes for preset_sounds table schema and constraints
- `fix-rls-policies.sql` - Row Level Security policy fixes
- `test_schema.sql` - Test data and schema validation

## 🚀 **Usage:**

### **For New Setup:**

1. Run `database-setup.sql` for complete initialization
2. Or use `quick-database-setup.sql` for faster development setup

### **For Existing Database:**

- Apply specific fix files as needed
- Run schema files individually for specific features

### **Order of Execution:**

1. Core tables (sounds, user_settings)
2. Preset system (sound_presets, preset_sounds)
3. Built-in data (builtin_sounds_setup)
4. Fixes and updates as needed

## 📋 **Notes:**

- All files include RLS policies for security
- Foreign key constraints are properly defined
- Includes proper indexes for performance
- Triggers for automatic timestamp updates
