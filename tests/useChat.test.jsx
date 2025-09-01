// Move mocks before imports to avoid initialization errors
let mockSupabase;
let onPayload;

vi.mock("@/supabaseClient.js", () => ({
  get supabase() {
    return mockSupabase;
  },
}));

const mockError = new Error("update failed");

// Mock Supabase client first
const updateChain = {
  is: jest.fn(() => ({
    eq: jest.fn(() => Promise.resolve({ data: null, error: mockError })),
  })),
};

mockSupabase = {
  from: jest.fn(() => ({
    update: jest.fn(() => updateChain),
  })),
  channel: jest.fn(() => {
    const channelObj = {
      on: jest.fn((event, filter, cb) => {
        onPayload = cb;
        return channelObj;
      }),
      subscribe: jest.fn((cb) => {
        cb("SUBSCRIBED");
        return { unsubscribe: jest.fn() };
      }),
    };
    return channelObj;
  }),
  removeChannel: jest.fn(),
};

vi.mock("@/utils/handleSupabaseError", () => ({
  handleSupabaseError: jest.fn(),
}));

// Test data
const page1 = [
  {
    id: "1",
    object_id: 1,
    sender: "a",
    content: "m1",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    object_id: 1,
    sender: "b",
    content: "m2",
    created_at: new Date().toISOString(),
  },
];
const page2 = [
  {
    id: "3",
    object_id: 1,
    sender: "a",
    content: "m3",
    created_at: new Date().toISOString(),
  },
];

const mockFetchMessages = jest
  .fn()
  .mockResolvedValueOnce({ data: page1, error: null })
  .mockResolvedValueOnce({ data: page2, error: null })
  .mockResolvedValue({ data: [], error: null });
let sendId = 10;
const mockSendMessage = jest.fn(() => {
  const id = String(sendId++);
  return Promise.resolve({
    data: {
      id,
      object_id: 1,
      sender: "me@example.com",
      content: "hi",
      created_at: new Date().toISOString(),
    },
    error: null,
  });
});

// Mock the useChatMessages hook
vi.mock("@/hooks/useChatMessages.js", () => ({
  useChatMessages: () => ({
    fetchMessages: mockFetchMessages,
    sendMessage: mockSendMessage,
  }),
}));

// Now import the components
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
const jest = vi;
import useChat from "@/hooks/useChat.js";
import { handleSupabaseError as mockHandleSupabaseError } from "@/utils/handleSupabaseError";

describe("useChat markMessagesAsRead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onPayload = null;
    sendId = 10;
  });

  it("загружает сообщения с учётом смещения без аргументов", async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: 1, userEmail: "me@example.com" }),
    );

    await waitFor(() => expect(mockFetchMessages).toHaveBeenCalledTimes(1));
    expect(mockFetchMessages).toHaveBeenCalledWith(1, {
      limit: 20,
      offset: 0,
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockFetchMessages).toHaveBeenCalledTimes(2);
    expect(mockFetchMessages).toHaveBeenLastCalledWith(1, {
      limit: 20,
      offset: page1.length,
    });
    expect(result.current.messages).toHaveLength(page1.length + page2.length);
  });

  it("обрабатывает ошибку при отметке сообщений прочитанными", async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: 1, userEmail: "me@example.com" }),
    );
    await waitFor(() => result.current.messages.length > 0);
    await act(async () => {
      await result.current.markMessagesAsRead();
    });
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      mockError,
      null,
      "Ошибка отметки сообщений как прочитанных",
    );
  });

  it("удаляет дубли при отправке одинаковых сообщений подряд", async () => {
    mockFetchMessages.mockReset();
    mockFetchMessages.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() =>
      useChat({ objectId: 1, userEmail: "me@example.com" }),
    );

    await waitFor(() => expect(mockFetchMessages).toHaveBeenCalled());

    await act(async () => {
      result.current.setNewMessage("hi");
    });
    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.messages).toHaveLength(1);
    const firstId = result.current.messages[0].client_generated_id;

    act(() => {
      onPayload({
        eventType: "INSERT",
        new: {
          id: "10",
          object_id: 1,
          sender: "me@example.com",
          content: "hi",
          created_at: new Date().toISOString(),
          client_generated_id: firstId,
        },
      });
    });

    await act(async () => {
      result.current.setNewMessage("hi");
    });
    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.messages).toHaveLength(2);
    const secondId = result.current.messages[1].client_generated_id;

    act(() => {
      onPayload({
        eventType: "INSERT",
        new: {
          id: "11",
          object_id: 1,
          sender: "me@example.com",
          content: "hi",
          created_at: new Date().toISOString(),
          client_generated_id: secondId,
        },
      });
    });

    expect(result.current.messages.filter((m) => m._optimistic)).toHaveLength(
      0,
    );
    expect(result.current.messages).toHaveLength(2);
  });

  it("игнорирует повторные INSERT события с существующим id", async () => {
    mockFetchMessages.mockReset();
    mockFetchMessages
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() =>
      useChat({ objectId: 1, userEmail: "me@example.com" }),
    );

    await waitFor(() =>
      expect(result.current.messages).toHaveLength(page1.length),
    );

    const prevMessages = result.current.messages;
    act(() => {
      onPayload({ eventType: "INSERT", new: { ...page1[0] } });
    });

    expect(result.current.messages).toBe(prevMessages);
    expect(result.current.messages).toHaveLength(page1.length);
  });
});
