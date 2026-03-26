import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: '../../packages/shared/src/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
});
