// writePresetsGuide.ts
import { writeFileSync } from 'fs'
import { join } from 'path'

// 1. Define the markdown content
const content = `# Brown Noise Player — Storage & Presets Guide

Feed this into Cursor to scaffold your storage schema, client logic, and mix-preset tables including per-sound volume levels.

---

## 1. Overview

We want to support two kinds of audio clips:  
1. **Built-in presets** (bundled with the app)  
2. **User uploads** (stored in Supabase Storage + Postgres)

Users can then save **combinations** of these sounds—with individual **volume levels**—as named “presets” for future sessions.

---

## 2. Built-in Presets (Local)

- Drop your core \`.mp3\`/\`.wav\` files into your \`public/presets/\` directory.  
- Example folder structure:
  \`\`\`
  public/
    presets/
      warm-brown.mp3
      deep-brown.mp3
      soft-brown.mp3
  \`\`\`
- In code, define:
  \`\`\`js
  const BUILT_IN_PRESETS = [
    { id: 'warm-brown', name: 'Warm Brown', url: '/presets/warm-brown.mp3' },
    { id: 'deep-brown', name: 'Deep Brown', url: '/presets/deep-brown.mp3' },
    { id: 'soft-brown', name: 'Soft Brown', url: '/presets/soft-brown.mp3' },
  ];
  \`\`\`

---

## 3. Supabase: User Sounds & Preset Combinations with Volume

### 3.1 Storage Bucket

- Create a **public** bucket named \`user-sounds\`.  
- Users upload clips here; files are keyed by UUID or timestamp.

### 3.2 Tables

#### \`sounds\`

| Column      | Type       | Notes                                        |
| ----------- | ---------- | -------------------------------------------- |
| \`id\`        | \`uuid\`     | PK, default \`uuid_generate_v4()\`             |
| \`user_id\`   | \`uuid\`     | FK → \`auth.users(id)\`, nullable (\`NULL\`=built-in) |
| \`name\`      | \`text\`     | Friendly name or original filename           |
| \`file_path\` | \`text\`     | Storage key (e.g. \`"user-sounds/abcd.mp3"\`)  |
| \`created_at\`| \`timestamp\`| default \`now()\`                              |

_If bundling built-ins locally, insert only user uploads here._

#### \`sound_presets\`

| Column      | Type       | Notes                                  |
| ----------- | ---------- | -------------------------------------- |
| \`id\`        | \`uuid\`     | PK, default \`uuid_generate_v4()\`       |
| \`user_id\`   | \`uuid\`     | FK → \`auth.users(id)\`, not null        |
| \`name\`      | \`text\`     | Preset name                           |
| \`created_at\`| \`timestamp\`| default \`now()\`                        |

#### \`preset_sounds\`

Join table linking presets to sounds, with per-sound volume and ordering:

| Column       | Type           | Notes                                     |
| ------------ | -------------- | ----------------------------------------- |
| \`preset_id\`  | \`uuid\`         | FK → \`sound_presets(id)\`, on delete CASCADE |
| \`sound_id\`   | \`uuid\`         | FK → \`sounds(id)\`                         |
| \`volume\`     | \`numeric(3,2)\` | Per-sound gain (0.00–1.00), default \`1.0\` |
| \`sort_order\` | \`int\`          | Ordering in the mix, default \`0\`          |
| **PK**       | (\`preset_id\`, \`sound_id\`) |                                     |

\`\`\`sql
-- sounds table
create table sounds (
  id          uuid          primary key default uuid_generate_v4(),
  user_id     uuid          references auth.users(id),
  name        text          not null,
  file_path   text          not null,
  created_at  timestamp     not null default now()
);

-- sound_presets table
create table sound_presets (
  id          uuid          primary key default uuid_generate_v4(),
  user_id     uuid          references auth.users(id) not null,
  name        text          not null,
  created_at  timestamp     not null default now()
);

-- preset_sounds join table
create table preset_sounds (
  preset_id   uuid          not null references sound_presets(id) on delete cascade,
  sound_id    uuid          not null references sounds(id),
  volume      numeric(3,2)  not null default 1.0,
  sort_order  int           not null default 0,
  primary key (preset_id, sound_id)
);
\`\`\`

---

## 4. Client Integration

1. **Load built-in presets**  
   \`\`\`js
   import { BUILT_IN_PRESETS } from './builtInPresets';
   \`\`\`

2. **Fetch user-uploaded sounds**  
   \`\`\`ts
   async function fetchUserSounds() {
     const { data: files, error } = await supabase
       .storage
       .from('user-sounds')
       .list();
     if (error) throw error;

     return files.map(f => ({
       id:    f.name,
       name:  f.metadata.originalName || f.name,
       url:   supabase
                .storage
                .from('user-sounds')
                .getPublicUrl(f.name)
                .publicURL
     }));
   }
   \`\`\`

3. **Fetch user presets & tracks**  
   \`\`\`ts
   async function fetchUserPresets(userId: string) {
     const { data: presets, error } = await supabase
       .from('sound_presets')
       .select(\`
         id,
         name,
         preset_sounds (
           sound_id,
           volume,
           sort_order,
           sounds: sounds ( id, name, file_path )
         )
       \`)
       .eq('user_id', userId)
       .order('created_at', { ascending: false });
     if (error) throw error;

     return presets.map(p => ({
       id: p.id,
       name: p.name,
       tracks: p.preset_sounds
         .sort((a, b) => a.sort_order - b.sort_order)
         .map(ps => ({
           id:     ps.sounds.id,
           name:   ps.sounds.name,
           url:    supabase
                     .storage
                     .from('user-sounds')
                     .getPublicUrl(ps.sounds.file_path)
                     .publicURL,
           volume: ps.volume
         }))
     }));
   }
   \`\`\`

4. **Combine & use**  
   \`\`\`ts
   async function loadAllSounds(userId: string) {
     const [userSounds, userPresets] = await Promise.all([
       fetchUserSounds(),
       fetchUserPresets(userId)
     ]);
     const allSounds = [...BUILT_IN_PRESETS, ...userSounds];
     return { allSounds, userPresets };
   }
   \`\`\`

---

## 5. Summary

- **Defaults** live locally for max performance & offline.  
- **User uploads** and **preset combinations** (with per-sound volumes) live in Supabase Storage & Postgres.  
- Front-end merges both sources into unified pickers and playback logic.
`

// 2. Determine output path (in the project root)
const outPath = join(process.cwd(), 'presets_guide.md')

// 3. Write the file synchronously
writeFileSync(outPath, content, { encoding: 'utf8' })

console.log(`✅ Wrote presets guide to ${outPath}`)