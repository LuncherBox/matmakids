# Eduli universal app

New frontend for Eduli built with Expo, React Native and TypeScript.

This app uses the existing Supabase project. The legacy production frontend at repository root remains untouched during migration.

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in the same Supabase project URL and publishable key used by the current web app.
3. Install dependencies:

```bash
npm install
```

4. Start web:

```bash
npm run web
```

5. Architecture proof:
- open the Expo web app,
- log in with an existing Eduli parent account,
- verify that the existing child profiles appear.

Do not create a second Supabase project for this frontend.
