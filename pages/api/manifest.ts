import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppManifest } from "@saleor/app-sdk/types";
import { withSentry } from "@sentry/nextjs";

import pkg from "../../package.json";
import { invoiceRequestedWebhook } from "./webhooks/customer-created";

const handler = createManifestHandler({
  async manifestFactory(context): Promise<AppManifest> {
    const { appBaseUrl } = context;

    return {
      id: "saleor.app.klaviyo",
      version: pkg.version,
      name: pkg.name,
      permissions: ["MANAGE_USERS", "MANAGE_ORDERS"],
      appUrl: appBaseUrl,
      tokenTargetUrl: `${appBaseUrl}/api/register`,
      webhooks: [invoiceRequestedWebhook.getWebhookManifest(appBaseUrl)],
    };
  },
});

export default withSentry(handler);
