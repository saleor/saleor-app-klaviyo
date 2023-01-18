import { NextWebhookApiHandler, SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";

import { createClient } from "../../../lib/graphql";
import Klaviyo from "../../../lib/klaviyo";
import { createSettingsManager } from "../../../lib/metadata";
import { saleorApp } from "../../../saleor-app";

export const orderCreatedWebhook = new SaleorAsyncWebhook<unknown>({
  name: "Order Created",
  webhookPath: "api/webhooks/order-created",
  asyncEvent: "ORDER_CREATED",
  apl: saleorApp.apl,
  query: "{}",
});

const handler: NextWebhookApiHandler<any> = async (req, res, context) => {
  const { payload, authData } = context;
  const { saleorApiUrl, token, appId } = authData;
  const client = createClient(saleorApiUrl, async () => Promise.resolve({ token }));
  const settings = createSettingsManager(client, appId);

  const klaviyoToken = await settings.get("PUBLIC_TOKEN");
  const klaviyoMetric = await settings.get("CUSTOMER_CREATED_METRIC");
  if (!klaviyoToken || !klaviyoMetric) {
    return res.status(400).json({ success: false, message: "App not configured." });
  }

  const { userEmail } = payload.order;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: "No user email." });
  }

  const klaviyoClient = Klaviyo(klaviyoToken);
  const klaviyoResponse = await klaviyoClient.send(klaviyoMetric, userEmail, payload);

  if (klaviyoResponse.status !== 200) {
    const klaviyoMessage = ` Message: ${(await klaviyoResponse.json())?.message}.` || "";
    return res.status(500).json({
      success: false,
      message: `Klaviyo API responded with status ${klaviyoResponse.status}.${klaviyoMessage}`,
    });
  }
  return res.status(200).json({ success: true, message: "Message sent!" });
};

export default orderCreatedWebhook.createHandler(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
