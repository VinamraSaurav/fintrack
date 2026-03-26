export type Bindings = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  RESEND_API_KEY: string;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
};

export type Variables = {
  userId: string;
  requestId: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
