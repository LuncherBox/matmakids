# Supabase setup

1. Create a Supabase project.
2. In SQL Editor run:
   - schema.sql
   - rls.sql
3. In Authentication enable email/password.
4. Set Site URL to the Railway production URL.
5. Add the Railway URL to allowed redirect URLs.
6. Copy:
   - Project URL
   - anon/public key
7. Add them to the frontend config when the auth implementation begins.

Security:
- public anon key is allowed in the browser when RLS is enabled
- NEVER put the service-role key in GitHub or frontend code

The current frontend is plain HTML/CSS/JS, so Supabase can be added without a framework migration.
