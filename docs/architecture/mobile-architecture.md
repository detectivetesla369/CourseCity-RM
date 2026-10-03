# CourseCity 1.0 — Future Mobile Client Architecture

## 1. Mobile Technology Baseline (Planned Client)

- **Framework**: React Native with **Expo** (Managed Workflow).
- **Navigation**: **Expo Router** (File-based native routing with stack and tab navigators).
- **Language**: TypeScript (strict mode, zero untyped payloads).
- **Package Integration**: Consumes shared monorepo packages (`@coursecity/contracts`, `@coursecity/api-client`, `@coursecity/validation`, `@coursecity/design-tokens`).

> The CourseCity mobile application is an authorized client of the exact same CourseCity API (`api.coursecity.com/api/v1`). Business logic, entitlement rules, grading calculations, and payment validations are never duplicated or forked into the mobile client.

---

## 2. Authentication & Secure Credential Storage

Mobile devices cannot use web `HttpOnly` browser cookies. Therefore, mobile authentication adheres to native security best practices:

- **Refresh Tokens**: Stored exclusively in hardware-backed secure storage via **`expo-secure-store`** (iOS Keychain / Android EncryptedSharedPreferences).
- **Access Tokens**: Held strictly **in memory** inside the API client session state; never persisted to unencrypted `AsyncStorage`.
- **Biometric Lock**: Optional FaceID / TouchID / Biometric prompt before accessing the account or personal notes.

---

## 3. UI, Motion & Mobile Conventions

### 3.1 Mobile Layout Hierarchy

```text
(tabs)/
  ├── index.tsx          # Featured courses, hero discovery, recent study resume card
  ├── search.tsx         # Full catalogue search with instant filters & category chips
  ├── library.tsx        # Enrolled courses, active reading progress, bookmarks, notes
  └── profile.tsx        # User settings, certificates, receipts, security & sign-out
course/
  └── [slug].tsx         # Course overview, syllabus, instructor details, checkout sheet
reader/
  └── [lessonId].tsx     # Native distraction-free ebook reader with vertical scroll
```

### 3.2 Native Interaction & Motion System

- Rather than porting heavyweight Three.js desktop WebGL scenes, mobile relies on **React Native Reanimated** and native physics.
- **Haptics**: Subtle haptic feedback (`expo-haptics`) on lesson completion, quiz submissions, and bookmark toggles.
- **Touch Targets**: All native controls adhere to minimum 48x48 dp interactive touch boundaries.

---

## 4. Offline Reading Roadmap (V2 Architecture-Ready)

While active V1 is online-first, the data architecture anticipates mobile offline study:

- **Local Storage**: WatermelonDB or Expo SQLite will cache purchased lesson content blocks.
- **Sync Engine**: Read timestamps and lesson completions will be queued locally and synchronized with the CourseCity API upon network reconnection using monotonic progress semantics.
