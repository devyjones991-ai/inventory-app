/* eslint-env node */
/* globals process, global */
import "@testing-library/jest-dom";
import { ReadableStream, TransformStream } from "stream/web";
import { TextEncoder, TextDecoder } from "util";

import { vi } from "vitest";

if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
if (!global.ReadableStream) global.ReadableStream = ReadableStream;
if (!global.TransformStream) global.TransformStream = TransformStream;
globalThis.jest = vi;

class MockBroadcastChannel {
  constructor() {}
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
}
if (!global.BroadcastChannel) global.BroadcastChannel = MockBroadcastChannel;

import "whatwg-fetch";

let server;

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

beforeAll(async () => {
  const mod = await import("./mocks/server");
  server = mod.server;
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
