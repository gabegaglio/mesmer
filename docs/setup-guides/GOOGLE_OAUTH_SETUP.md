# Google OAuth Setup Guide for Supabase (Official Documentation)

## 🎯 **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Mesmer Auth")
4. Click "Create"

## 📋 **Step 2: Configure OAuth Consent Screen**

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Select **"External"** (unless you have a Google Workspace)
3. Fill in required fields:

   - **App name**: Your app name (e.g., "Mesmer")
   - **User support email**: Your email
   - **Developer contact email**: Your email

4. **IMPORTANT**: Under **Authorized domains**, add your Supabase project's domain:

   ```
   YOUR_PROJECT_ID.supabase.co
   ```

   (Replace `YOUR_PROJECT_ID` with your actual Supabase project ID)

5. Configure the following **non-sensitive scopes**:

   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

6. Click **"Save and Continue"** through all steps

## 🔐 **Step 3: Create OAuth 2.0 Credentials**

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth Client ID"**
3. For application type, choose **"Web application"**
4. Enter name: "Supabase Auth"

5. **Under Authorized JavaScript origins**, add your site URL:

   ```
   http://localhost:5173
   https://yourdomain.com
   ```

6. **Under Authorized redirect URLs**, add the callback URL from your Supabase Dashboard:

   **To find this URL:**

   - Go to Supabase Dashboard → **Authentication** → **Providers**
   - Expand the **Google Auth Provider** section
   - Copy the **Callback URL (for OAuth)**

   It will look like:

   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

7. Click **"Create"**

## 📝 **Step 4: Copy Your Credentials**

After creating, you'll see:

- **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwx`

**⚠️ IMPORTANT: Copy both values!**

## 🎛️ **Step 5: Configure Supabase Dashboard**

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and toggle it **ON**
4. In the **Google Auth Provider** section, enter:
   - **OAuth client ID**: Paste your Google Client ID
   - **OAuth client secret**: Paste your Google Client Secret
5. Click **"Save"**

## ✅ **Example Configuration**

### Google Cloud Console:

```
Application Type: Web application
Authorized JavaScript origins:
  - http://localhost:5173
  - https://yourdomain.com
Authorized redirect URIs:
  - https://abcdefghijk.supabase.co/auth/v1/callback
```

### Supabase Dashboard:

```
OAuth client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
OAuth client secret: GOCSPX-abcdefghijklmnopqrstuvwx
```

## 🧪 **Step 6: Test Your Setup**

Your existing code in `AuthContext.tsx` should now work:

```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { error };
};
```

## 🔧 **Troubleshooting**

### **"redirect_uri_mismatch" Error**

- Verify your redirect URI in Google Console exactly matches the one from Supabase Dashboard
- Check for typos in your Supabase project reference

### **"unauthorized_client" Error**

- Ensure your domain is added to **Authorized domains** in OAuth consent screen
- Verify JavaScript origins include your development and production URLs

### **"access_denied" Error**

- Make sure OAuth consent screen is properly configured
- Check that required scopes are added

### **Development vs Production**

- **Development**: Add `http://localhost:5173` to Authorized JavaScript origins
- **Production**: Add your actual domain to both origins and authorized domains

## 📋 **Final Checklist**

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured with Supabase domain
- [ ] Required scopes added (email, profile, openid)
- [ ] OAuth 2.0 credentials created (Web application)
- [ ] JavaScript origins added (localhost + production domain)
- [ ] Redirect URI from Supabase dashboard added
- [ ] Client ID and Secret copied to Supabase
- [ ] Google provider enabled in Supabase
- [ ] Google authentication tested

## 🎯 **Key URLs You Need:**

1. **Supabase Project Domain**: `YOUR_PROJECT_ID.supabase.co`
2. **Callback URL**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. **Your Site URLs**:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

---

🎉 **Your Google OAuth is now configured according to official Supabase documentation!**
