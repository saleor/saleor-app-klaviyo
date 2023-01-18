import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppManifest } from "@saleor/app-sdk/types";

import pkg from "../../package.json";
import { customerCreatedWebhook } from "./webhooks/customer-created";
import { fulfillmentCreatedWebhook } from "./webhooks/fulfillment-created";
import { orderCreatedWebhook } from "./webhooks/order-created";
import { orderFullyPaidWebhook } from "./webhooks/order-fully-paid";

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
      webhooks: [
        customerCreatedWebhook.getWebhookManifest(appBaseUrl),
        fulfillmentCreatedWebhook.getWebhookManifest(appBaseUrl),
        orderCreatedWebhook.getWebhookManifest(appBaseUrl),
        orderFullyPaidWebhook.getWebhookManifest(appBaseUrl),
      ],
    };
  },
});

export default handler;
