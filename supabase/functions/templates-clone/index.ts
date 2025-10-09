import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { handler } from "../templates/clone/index.ts";

serve(handler);
