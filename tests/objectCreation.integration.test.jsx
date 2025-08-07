/* eslint-env node */
/* global beforeAll, afterEach, afterAll */

let call = 0;
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useState: (init) => {
      if (call === 0) {
        call++;
        return actual.useState(init); // objects
      }
      if (call === 1) {
        call++;
        return actual.useState({ id: "temp", name: "Temp" }); // selected
      }
      return actual.useState(init);
    },
  };
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("*/rest/v1/objects", () => {
    return HttpResponse.json([]);
  }),
  http.post("*/rest/v1/objects", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 1, ...body });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.mock("../src/supabaseClient.js", () => {
  const fetchFrom = async (method, body) => {
    const res = await fetch("http://localhost/rest/v1/objects", {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    return { data, error: null };
  };
  const emptyResponse = Promise.resolve({ data: [], error: null });
  return {
    supabase: {
      auth: {
        getSession: vi.fn(() =>
          Promise.resolve({
            data: { session: { user: { id: "1", email: "test@example.com" } } },
          }),
        ),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
      from: (table) => {
        if (table === "objects") {
          return {
            select: () => ({
              order: () => fetchFrom("GET"),
            }),
            insert: (rows) => ({
              select: () => ({
                single: () => fetchFrom("POST", rows[0]),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => {
              const res = Promise.resolve({ data: [], error: null });
              res.order = () => emptyResponse;
              return res;
            },
            order: () => emptyResponse,
          }),
        };
      },
    },
  };
});

vi.mock("../src/utils/notifications", () => ({
  requestNotificationPermission: vi.fn(),
  pushNotification: vi.fn(),
  playTaskSound: vi.fn(),
  playMessageSound: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

import App from "../src/App";

describe("создание объекта", () => {
  it("добавляет объект и выбирает его по умолчанию", async () => {
    render(<App />);

    fireEvent.click(await screen.findByText("Добавить"));
    fireEvent.change(screen.getByPlaceholderText("Название"), {
      target: { value: "Новый объект" },
    });
    fireEvent.click(screen.getByText("Сохранить"));

    expect(
      await screen.findByRole("button", { name: "Новый объект" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Новый объект" }),
    ).toBeInTheDocument();
  });
});
