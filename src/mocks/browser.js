import { setupWorker } from "msw";

import { handlers } from "../../tests/mocks/server";

export const worker = setupWorker(...handlers);
