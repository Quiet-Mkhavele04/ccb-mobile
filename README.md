# CCB (Connect Communicate Belong) — Expo / React Native

## One-time setup (in VS Code terminal)

1. Make sure Node.js (LTS) is installed, then install Expo's CLI on demand (no global install needed):
   ```bash
   npx create-expo-app CCB --template blank-typescript
   ```
   Then copy the files from this project (`App.tsx`, `app.json`, `babel.config.js`, and everything in `src/`) into that generated `CCB` folder, overwriting the defaults.

   Or, if you already have a `CCB` folder from these files: just run `npm install` inside it — `package.json` already lists everything.

2. Install dependencies:
   ```bash
   cd CCB
   npm install
   ```

3. Install the Expo Go app on your Android phone (Play Store), and make sure your phone and computer are on the **same Wi-Fi network**.

4. Start the dev server:
   ```bash
   npx expo start
   ```
   A QR code appears in the terminal. Open **Expo Go** on your Android phone and scan it — the app loads live on your device.

## What's included so far

- `src/theme/colors.ts` — the emerald/gold/charcoal/off-white design tokens
- `src/theme/fonts.ts` — Outfit + DM Sans font tokens
- `src/db/database.ts` — local SQLite schema + seed data (contacts, messages, communities, transactions) with SA names/context
- `src/components/Logo.tsx` — the CCB speech-bubble logo (SVG)
- `src/screens/onboarding/WelcomeScreen.tsx` — **Screen 1**: gradient welcome screen with logo, tagline, CTA buttons, language hint
- `App.tsx` — loads fonts, initializes the DB, renders the Welcome screen

## Coming next (say "next screen" when ready)

- Language selection + remaining onboarding steps
- Bottom tab navigation (Home / Communities / Discover / Payments / Profile)
- Home screen (chat list, active contacts carousel)
- Chat screen (message bubbles, translation toggle)
- Communities, Discover, Payments, Profile screens
