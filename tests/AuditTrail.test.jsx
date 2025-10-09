import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuditTrail from "@/components/AuditTrail.jsx";

const mockLogs = [
  {
    id: "1",
    user_id: "user-1",
    action: "insert",
    target_table: "tasks",
    target_id: "t1",
    meta: { title: "Test" },
    created_at: "2024-01-01T00:00:00Z",
  },
];

const queries = [];

vi.mock("@/supabaseClient.js", () => {
  const createQuery = () => {
    const query = {};
    const resolveValue = {
      data: mockLogs,
      error: null,
      count: mockLogs.length,
    };

    Object.assign(query, {
      select: vi.fn(() => query),
      order: vi.fn(() => query),
      or: vi.fn(() => query),
      range: vi.fn(() => query),
      then: vi.fn((onFulfilled) => {
        if (typeof onFulfilled === "function") {
          return Promise.resolve(onFulfilled(resolveValue));
        }
        return Promise.resolve(resolveValue);
      }),
      catch: vi.fn(() => query),
      finally: vi.fn(() => query),
    });

    return query;
  };

  const from = vi.fn(() => {
    const query = createQuery();
    queries.push(query);
    return query;
  });

  return {
    supabase: { from },
  };
});

beforeEach(() => {
  queries.length = 0;
});

describe("AuditTrail", () => {
  it("отображает логи", async () => {
    render(<AuditTrail objectId="1" pageSize={10} />);
    expect(await screen.findByText("insert")).toBeInTheDocument();
    expect(screen.getByText("tasks")).toBeInTheDocument();
  });

  it("формирует фильтр по объекту", async () => {
    render(<AuditTrail objectId="abc" pageSize={5} />);

    expect(await screen.findByText("insert")).toBeInTheDocument();

    expect(queries).toHaveLength(1);
    expect(queries[0].or).toHaveBeenCalledWith(
      [
        "target_id.eq.abc",
        "meta->>object_id.eq.abc",
        "meta->old->>object_id.eq.abc",
        "meta->new->>object_id.eq.abc",
      ].join(","),
    );
  });

  it("комбинирует фильтр по объекту и поиск", async () => {
    const user = userEvent.setup();
    render(<AuditTrail objectId="obj-1" pageSize={5} />);

    expect(await screen.findByText("insert")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(
      "Пользователь, действие или детали",
    );
    await user.type(input, "test");
    await user.click(screen.getByRole("button", { name: "Поиск" }));

    await waitFor(() => expect(queries).toHaveLength(2));

    expect(queries[1].or).toHaveBeenCalledTimes(1);
    const [args] = queries[1].or.mock.calls[0];
    const parts = args.split(/(?<=\)),/).map((part) => part.trim());
    expect(parts).toHaveLength(12);
    expect(parts).toContain("and(target_id.eq.obj-1,action.ilike.%test%)");
    expect(parts).toContain(
      "and(meta->new->>object_id.eq.obj-1,meta::text.ilike.%test%)",
    );
  });

  it("выполняет поиск без objectId", async () => {
    const user = userEvent.setup();
    render(<AuditTrail pageSize={5} />);

    expect(await screen.findByText("insert")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(
      "Пользователь, действие или детали",
    );
    await user.type(input, "meta");
    await user.click(screen.getByRole("button", { name: "Поиск" }));

    await waitFor(() => expect(queries).toHaveLength(2));

    expect(queries[1].or).toHaveBeenCalledWith(
      [
        "action.ilike.%meta%",
        "target_table.ilike.%meta%",
        "meta::text.ilike.%meta%",
      ].join(","),
    );
  });
});
