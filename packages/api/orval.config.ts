import { defineConfig } from 'orval';

/**
 * Two backends, two clients — ogonggo-BE runs a separate service per audience
 * (ogonggo-api-user:8080 for apps/web, ogonggo-api-admin:8081 for apps/admin),
 * each with its own springdoc /v3/api-docs. Point OGONGGO_USER_API_URL /
 * OGONGGO_ADMIN_API_URL at a running backend (or a checked-in spec file) before
 * running `pnpm codegen`.
 */
export default defineConfig({
  user: {
    input: process.env.OGONGGO_USER_API_URL ?? 'http://localhost:8080/v3/api-docs',
    output: {
      target: 'src/generated/user/endpoints.ts',
      schemas: 'src/generated/user/models',
      client: 'react-query',
      mock: true,
      override: {
        mutator: {
          path: './src/lib/http-client.ts',
          name: 'httpClient',
        },
      },
    },
  },
  admin: {
    input: process.env.OGONGGO_ADMIN_API_URL ?? 'http://localhost:8081/v3/api-docs',
    output: {
      target: 'src/generated/admin/endpoints.ts',
      schemas: 'src/generated/admin/models',
      client: 'react-query',
      mock: true,
      override: {
        mutator: {
          path: './src/lib/http-client.ts',
          name: 'httpClient',
        },
      },
    },
  },
});
