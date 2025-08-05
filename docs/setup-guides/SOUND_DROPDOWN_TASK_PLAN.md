# 🎵 Custom Sound Dropdown Feature - Task Plan

## 📋 **Core Concept**

Transform each sound icon (🌊🔥🌧️etc.) next to sliders into clickable elements that open dropdown menus for sound selection and customization.

## 🎯 **User Experience Flow**

### **1. Sound Selection Dropdown**

```
Click any sound icon → Dropdown opens with:

🌊 Ocean Waves (current) ✓
🌊 Gentle Waves
🌊 Stormy Sea
─────────────────────────
🔥 Crackling Fire
🔥 Campfire
🔥 Fireplace
─────────────────────────
🎵 White Noise
🎵 Brown Noise
🎵 Pink Noise
─────────────────────────
🎤 My Beach Recording (custom)
🎤 Thunderstorm.mp3 (custom)
─────────────────────────
➕ Add Custom Sound...
```

The menu will contain the current sound as the first option
Available options that are not currently in use will appear below
below the preset options will be a section that contains user uploaded sounds
then below that will be a add sound button 
We may want to implement a delete button next to custom sounds

### **2. Custom Sound Upload Flow**

1. Click "➕ Add Custom Sound..."
2. File picker opens (Accept: `.mp3`, `.wav`, `.ogg`, `.m4a`)
3. Preview modal appears:
   ```
   "Preview: thunderstorm.mp3"
   [▶️ Play] [Name: "My Thunderstorm"]
   [🏷️ Category: Nature ▼]
   [Cancel] [Add to Library]
   ```
4. Sound added to appropriate category
5. Immediately available in all dropdowns

## 🛠️ **Technical Implementation**

### **Data Structure**

```typescript
interface CustomSound {
  id: string;
  name: string;
  fileName: string;
  category: SoundCategory;
  audioData: ArrayBuffer; // Stored in IndexedDB
  dateAdded: Date;
  fileSize: number;
}

interface SoundCategory {
  id: string;
  name: string;
  icon: string;
  sounds: (PresetSound | CustomSound)[];
}

interface SoundBank {
  categories: SoundCategory[];
  customSounds: CustomSound[];
}
```

### **Component Structure**

```
📁 src/components/
├── 📁 SoundDropdown/
│   ├── SoundDropdown.tsx         // Main dropdown component
│   ├── SoundItem.tsx             // Individual sound option
│   ├── CustomSoundUpload.tsx     // Upload modal
│   ├── SoundPreview.tsx          // Preview player
│   └── SoundDropdown.module.css  // Dropdown styles
├── 📁 SoundManager/
│   ├── SoundLibrary.ts           // Sound management logic
│   ├── IndexedDBManager.ts       // Custom sound storage
│   └── AudioProcessor.ts         // File validation/processing
```

### **Storage Strategy**

- **IndexedDB**: Store custom audio files (handles large files better than localStorage)
- **localStorage**: Store sound library metadata and user preferences
- **Fallback**: Graceful degradation if storage unavailable

## 🎨 **UI/UX Requirements**

### **Dropdown Behavior**

- **Positioning**: Smart positioning (above/below based on screen space)
- **Closing**: Click outside, ESC key, or selection
- **Loading**: Show loading states for custom sound processing
- **Responsive**: Works on mobile with touch-friendly sizing

### **Visual Design**

- **Icons**: Different icons for preset (🌊) vs custom (🎤) sounds
- **Current Selection**: Visual checkmark and highlight
- **Categories**: Clear visual separation with dividers
- **Upload**: Prominent but not overwhelming "Add Custom" option

### **Sound Management**

- **Preview**: Click any sound to preview (short 3-5 sec sample)
- **Remove Custom**: Right-click context menu for custom sounds
- **Rename**: Double-click custom sound names to edit
- **File Size**: Show file size for custom sounds, warn if too large

## 📚 **Preset Sound Library**

### **Nature Category**

- Ocean Waves (current default)
- Gentle Waves
- Stormy Sea
- Light Rain (current default)
- Heavy Rain
- Thunderstorm
- Crackling Fire (current default)
- Campfire
- Fireplace
- Forest Ambience
- Wind in Trees

### **Focus Category**

- White Noise
- Brown Noise
- Pink Noise
- Binaural Beats (40Hz)
- Cafe Chatter
- Library Ambience

### **Urban Category**

- City Traffic
- Subway Sounds
- Coffee Shop
- Busy Restaurant
- Office Ambience

## 🔧 **Implementation Phases**

### **Phase 1: Basic Dropdown**

- [ ] Convert current sound icons to clickable elements
- [ ] Create dropdown component with preset sounds
- [ ] Implement sound switching functionality
- [ ] Basic styling and positioning

### **Phase 2: Custom Sound Upload**

- [ ] File picker integration
- [ ] Audio file validation
- [ ] IndexedDB storage setup
- [ ] Preview functionality

### **Phase 3: Sound Management**

- [ ] Custom sound renaming
- [ ] Custom sound removal
- [ ] Category organization
- [ ] Import/export sound library

### **Phase 4: Polish & Features**

- [ ] Advanced audio processing (volume normalization)
- [ ] Sound waveform visualization
- [ ] Keyboard shortcuts
- [ ] Sound sharing/import from URLs

## 🚨 **Technical Considerations**

### **File Handling**

- **Size Limits**: 10MB per file (configurable)
- **Format Support**: MP3, WAV, OGG, M4A
- **Validation**: Check audio format, duration, file integrity
- **Processing**: Optional audio normalization

### **Performance**

- **Lazy Loading**: Load dropdown content only when opened
- **Audio Caching**: Smart caching for frequently used sounds
- **Memory Management**: Unload unused audio when switching

### **Error Handling**

- **Upload Failures**: Clear error messages and retry options
- **Corrupted Files**: Graceful handling with user feedback
- **Storage Full**: Warn user and suggest cleanup
- **Network Issues**: Offline capability for stored sounds

## 🎯 **Success Metrics**

- Users can easily discover and switch sounds
- Custom sound upload is intuitive and reliable
- No performance impact on main audio mixing
- Persistent storage works across sessions
- Mobile experience is touch-friendly

## 📝 **Notes for Implementation**

- Keep existing sound system intact during development
- Test with various audio file formats and sizes
- Ensure accessibility (keyboard navigation, screen readers)
- Consider adding sound preview waveforms in future
- Plan for potential sound sharing between users
