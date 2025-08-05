# Mesmer - Ambient Sound Mixer

A beautiful, responsive web application for creating custom ambient sound environments. Built with React, TypeScript, and modern web technologies.

## 🌟 Features

### 🎵 Audio System

- **Multi-slot audio mixing** with independent volume controls
- **Built-in sound presets** (nature, focus, urban environments)
- **Custom sound upload** with cloud storage integration
- **Real-time audio processing** with Howler.js
- **Mute/unmute functionality** with visual feedback

### 🎨 User Experience

- **Dynamic theming** (slate, day, night, midnight modes)
- **Glassmorphic design** with smooth animations
- **Responsive layout** optimized for all devices
- **Drag-and-drop interface** for easy sound management

### 🔐 Authentication & Settings

- **Secure user authentication** with Supabase
- **Real-time settings sync** across devices
- **Personalized preferences** with cloud storage
- **Optimized loading** with proper auth flow

## 🚀 Live Demo

**Visit the live application**: [https://gabegaglio.github.io/mesmer](https://gabegaglio.github.io/mesmer)

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Framer Motion
- **Audio**: Howler.js for cross-browser audio
- **Backend**: Supabase (auth, database, storage)
- **Deployment**: GitHub Pages with automatic CI/CD

## 📱 Features Overview

### Audio Controls

- **6 independent audio slots** for mixing
- **Volume sliders** with real-time adjustment
- **Built-in presets**: Ocean waves, rain, fire, crickets, wind, white noise
- **Custom sound upload** with drag-and-drop
- **Mute controls** with visual indicators

### Theme System

- **4 beautiful themes**: Slate, Day, Night, Midnight
- **Smooth transitions** between themes
- **Glassmorphic effects** throughout the interface
- **Responsive design** for all screen sizes

### User Settings

- **Cloud-synced preferences** across devices
- **Theme persistence** with automatic saving
- **Audio settings** with debounced updates
- **Secure authentication** with Supabase

## 🎯 Use Cases

- **Productivity**: Focus-enhancing ambient sounds
- **Relaxation**: Calming nature and meditation sounds
- **Sleep**: Gentle background noise for better sleep
- **Work**: Professional environments with subtle audio

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/gabegaglio/mesmer.git
cd mesmer
npm install
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

## 🔐 Supabase Configuration

### OAuth Settings (Required for Live Deployment)

To enable Google OAuth on the live site, configure these URLs in your Supabase dashboard:

1. **Go to**: Supabase Dashboard > Authentication > URL Configuration
2. **Add Site URL**: `https://gabegaglio.github.io/mesmer/`
3. **Add Redirect URLs**:
   - `https://gabegaglio.github.io/mesmer/`
   - `https://gabegaglio.github.io/mesmer/auth`
   - `https://gabegaglio.github.io/mesmer/admin`

### Google OAuth Provider

1. **Go to**: Supabase Dashboard > Authentication > Providers
2. **Enable Google provider**
3. **Add Authorized redirect URI**: `https://udakjarznbquozurrbyx.supabase.co/auth/v1/callback`

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**
