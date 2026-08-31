# `@ogonggo/config`

Shared build/quality configuration. Each app or package extends `tsconfig.base.json` from here;
`oxlint`/`oxfmt` read the workspace-root `.oxlintrc.json` / `.oxfmtrc.json` directly (neither tool
supports a package-based `extends` yet), so those two files stay at the repo root instead of in
this package.
