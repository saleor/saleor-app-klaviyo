import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";
import { withSentry } from "@sentry/nextjs";

import { apl } from "../../lib/apl";

const handler = createAppRegisterHandler({
  apl,
});

export default withSentry(handler);
