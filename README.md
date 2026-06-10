# SnapDoc AI — Mobile

React Native (Expo) app for SnapDoc AI. Photograph a document, get an AI-powered
plain-language explanation, and ask follow-up questions in a chat interface.

Part of the SnapDoc AI platform — see the `snapdoc-ai` knowledge repo for
overall architecture, API contracts, and database schema.

---

## Stack

- React Native + Expo (SDK 54)
- expo-router (file-based navigation)
- react-native-reanimated v4 (animations)
- Supabase JS client (auth + data)

---

## Getting Started

```bash
npm install
npx expo start
```

Then press `a` for Android emulator, or scan the QR code with Expo Go on a physical device.

### Environment

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:3001   # LAN IP for Expo Go; use deployed URL for APK builds
```

> Never commit `.env` files or put the Gemini API key in a mobile env var — Gemini calls go through the backend only.

---

## App Structure

| Screen | File | Description |
|--------|------|-------------|
| Auth | `app/(auth)/index.tsx` | Login / signup via Supabase |
| Home | `app/(app)/index.tsx` | Active scan list, swipe-to-archive/delete, stats |
| Archived | `app/(app)/archived.tsx` | Archived scans, swipe-to-unarchive/delete |
| Camera | `app/(app)/camera.tsx` | Camera capture or gallery pick → Gemini OCR → backend |
| Result | `app/(app)/result/[scanId].tsx` | AI summary, key points, flags |
| Chat | `app/(app)/chat/[scanId].tsx` | Follow-up question chat interface |
| Profile | `app/(app)/profile.tsx` | User info, scan stats, sign out |

---

## Building an APK

See `eas.json` for build profiles. Run `eas build -p android --profile <profile>`,
or build locally — see the gotchas doc in the knowledge repo for details.

---

## Related Docs

- `snapdoc-ai` knowledge repo — `CLAUDE.md` has env vars, API endpoints, DB schema, gotchas
- `snapdoc-ai/maps/mobile/` — architecture maps and gotchas for this app
