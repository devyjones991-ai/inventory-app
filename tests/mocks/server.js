import { setupServer } from "msw/node";
import { rest } from "msw";

const API_URL = "http://localhost";

export const handlers = [
  rest.options(`${API_URL}/functions/v1/cacheGet`, (req, res, ctx) =>
    res(ctx.status(200)),
  ),
  rest.get(`${API_URL}/functions/v1/cacheGet`, (req, res, ctx) => {
    const table = req.url.searchParams.get("table");
    if (table === "profiles") {
      return res(ctx.status(200), ctx.json({ data: { role: "user" } }));
    }
    if (table === "objects") {
      return res(ctx.status(200), ctx.json({ data: [] }));
    }
    return res(ctx.status(404));
  }),
  rest.delete(`${API_URL}/functions/v1/cacheGet`, (req, res, ctx) =>
    res(ctx.status(200)),
  ),
  rest.get(`${API_URL}/api/export/:table`, (req, res, ctx) =>
    res(ctx.status(200), ctx.body("id,name\n1,Item")),
  ),
  rest.post(`${API_URL}/api/import/:table`, async (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ processed: 0, errors: [] })),
  ),
];

export const server = setupServer(...handlers);
