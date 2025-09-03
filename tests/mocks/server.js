import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const API_URL = "http://localhost";

export const handlers = [
  http.options(`${API_URL}/functions/v1/cacheGet`, () =>
    HttpResponse.json({}, { status: 200 }),
  ),
  http.get(`${API_URL}/functions/v1/cacheGet`, ({ request }) => {
    const url = new URL(request.url);
    const table = url.searchParams.get("table");
    if (table === "profiles") {
      return HttpResponse.json({ data: { role: "user" } }, { status: 200 });
    }
    if (table === "objects") {
      return HttpResponse.json({ data: [] }, { status: 200 });
    }
    return new HttpResponse(null, { status: 404 });
  }),
  http.delete(`${API_URL}/functions/v1/cacheGet`, () =>
    HttpResponse.json({}, { status: 200 }),
  ),
  http.get(
    `${API_URL}/api/export/:table`,
    () => new HttpResponse("id,name\n1,Item", { status: 200 }),
  ),
  http.post(`${API_URL}/api/import/:table`, async () =>
    HttpResponse.json({ processed: 0, errors: [] }, { status: 200 }),
  ),
];

export const server = setupServer(...handlers);
