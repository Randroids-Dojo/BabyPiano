# Baby Piano — Game Design Document (GDD)

## 1. Overview
Baby Piano is a simple interactive piano app for kids, optimized for **mobile screens in landscape mode**.

## 2. Product Requirements
- Touch playable piano keyboard.
- Multiple MIDI SFX instrument types (minimum: **Grand Piano**, **Toy Xylophone**).
- Built-in lullaby note maps so the app knows the keys to press.
- Real-time key lighting while notes are played.
- Learn mode that highlights the next key to press for the selected song.
- Auto deployment to Vercel on push to the main branch.
- Version upgrade notification banner when a newer deployment is available.

## 3. Target Device & Orientation
- **Target devices:** mobile phones/tablets
- **Orientation:** **landscape only**
- **Design constraints:**
  - Keyboard spans most of screen width.
  - Key hit targets are large enough for children.
  - Minimal controls visible at once.

## 4. Core Features

### 4.1 Interactive Keyboard
- Tapping a key plays its note immediately.
- Keys can be pressed repeatedly with low latency.
- Basic polyphony is preferred (multi-touch if supported by implementation).

### 4.2 MIDI SFX Instrument Types
Required selectable sound presets:
- **Grand Piano**
- **Toy Xylophone**

### 4.3 Built-in Lullaby Note Data
The app stores note sequences (key presses) for learn mode.

#### Twinkle Twinkle Little Star (C major)
`C C G G A A G | F F E E D D C | G G F F E E D | G G F F E E D | C C G G A A G | F F E E D D C`

#### Mary Had a Little Lamb (C major)
`E D C D | E E E | D D D | E G G | E D C D | E E E E | D D E D | C`

Notes:
- Sequences are ordered and step-based.
- Each step maps to one highlighted key in learn mode.

### 4.4 Key Lighting
- Pressed key lights up while active.
- Light state is visible for both free play and learn mode input.

### 4.5 Learn Mode
- Player selects a built-in song.
- The app highlights the **next required key**.
- If the correct key is pressed, the pointer advances to the next note.
- On final note, song is marked complete and can restart.

### 4.6 Version Upgrade Notification
- The app exposes the current deployed app version via response header.
- Client compares baked-in bundle version with server version periodically.
- If mismatch is detected, show a top banner: “A new version is available”.
- Banner includes a **Refresh** action to reload and pick up the latest build.

## 5. Primary User Flow
1. Launch app in landscape.
2. Select instrument (Grand Piano or Toy Xylophone).
3. Choose:
   - **Free Play** to tap any key.
   - **Learn Mode** to follow highlighted notes for a selected lullaby.
4. In Learn Mode, complete the sequence from first to last note.

## 6. Deployment Requirement
- Repository includes Vercel project config (`vercel.json`).
- GitHub repo is connected to Vercel so pushes to `main` auto-deploy.
- App version is sourced from `package.json` and exposed to client + API.

## 7. Out of Scope (for now)
- User accounts/profiles.
- Multiplayer/online features.
- Ads/in-app purchases.
- Additional songs beyond the two listed above.
- Advanced lessons or scoring systems.
