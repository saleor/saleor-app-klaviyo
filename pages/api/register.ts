import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";
import { withSentry } from "@sentry/nextjs";

import { saleorApp } from "../../saleor-app";

const handler = createAppRegisterHandler({
  apl: saleorApp.apl,
});

export default withSentry(handler);
