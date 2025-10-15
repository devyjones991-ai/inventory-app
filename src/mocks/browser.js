import { setupWorker } from "msw/browser";

import { handlers } from "../../tests/mocks/server";

export const worker = setupWorker(...handlers);
