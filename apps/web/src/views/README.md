# views

This is the FSD "pages" layer — route-level composition of widgets, features and entities. It is
named `views/` instead of `pages/` only in this app: Next.js App Router auto-scans any `src/pages/`
directory as a legacy Pages Router route table, and a plain FSD layer sitting there breaks the
build's route type generation. `apps/admin` has no such conflict and keeps the standard `pages/`
name.

Each `src/app/**/page.tsx` stays a thin wrapper that imports its view from here.
