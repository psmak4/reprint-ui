import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

// Better Auth needs the base server URL (it adds /api/auth automatically)
const SERVER_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
  : 'http://localhost:3001';

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  plugins: [
    adminClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  admin,
} = authClient;
