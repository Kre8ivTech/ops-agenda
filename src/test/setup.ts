/**
 * Vitest Test Setup
 * 
 * Global test configuration and setup for unit tests.
 */

import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.MICROSOFT_CLIENT_ID = "test-microsoft-client-id";
process.env.MICROSOFT_CLIENT_SECRET = "test-microsoft-client-secret";
process.env.MICROSOFT_TENANT_ID = "common";
process.env.MICROSOFT_REDIRECT_URI = "http://localhost:3000/api/auth/callback/microsoft";
process.env.OPENAI_API_KEY = "sk-test-key-1234567890";
process.env.NEXTAUTH_SECRET = "test-secret-32-characters-long-here-1234567890";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.INNGEST_EVENT_KEY = "test-inngest-event-key";
process.env.INNGEST_SIGNING_KEY = "signkey-test-inngest-signing-key";
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64 chars
