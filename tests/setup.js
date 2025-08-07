import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, beforeEach, vi } from 'vitest';
import { server } from './mocks/server';

let supabase;

beforeAll(() => server.listen());

beforeEach(async () => {
  supabase = (await import('../src/supabaseClient')).supabase;
  vi.spyOn(supabase, 'channel').mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() });
  vi.spyOn(supabase, 'removeChannel').mockImplementation(() => {});
  vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: null } });
  vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => server.close());
