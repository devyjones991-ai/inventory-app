/* eslint-env node */
/* globals process, global */
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

globalThis.jest = vi;

if (typeof File === "undefined") {
  globalThis.File = class File extends Blob {
    constructor(parts, name, opts) {
      super(parts, opts);
      this.name = name;
    }
  };
}
global.DOMException =
  global.DOMException ||
  class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name;
    }
  };

process.env.VITE_API_BASE_URL = "http://localhost";
process.env.VITE_SUPABASE_URL = "http://localhost";
process.env.VITE_SUPABASE_ANON_KEY = "test-key";

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => {
      const proxy = new Proxy(() => {}, {
        get(target, prop) {
          if (prop === "then") {
            return (resolve) => resolve({ data: null, error: null });
          }
          return proxy;
        },
        apply() {
          return proxy;
        },
      });
      return proxy;
    },
  };
});

// Provide a default fetch stub to avoid real network calls in tests
// Tests that need specific fetch behavior override this with their own mocks
if (!globalThis.fetch || !globalThis.fetch.mock) {
  const defaultResponse = {
    status: 404,
    ok: false,
    json: async () => ({}),
    text: async () => "",
    clone() {
      return this;
    },
  };
  globalThis.fetch = vi.fn(async () => defaultResponse);
}
