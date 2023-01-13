import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/const";
import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { withSentry } from "@sentry/nextjs";
import type { Handler } from "retes";
import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";

import Klaviyo from "../../../lib/klaviyo";
import { getValue } from "../../../lib/metadata";
import { saleorApp } from "../../../saleor-app";

export const orderFullyPaidWebhook = new SaleorAsyncWebhook<unknown>({
  name: "Order Fully Paid",
  webhookPath: "api/webhooks/order-fully-paid",
  asyncEvent: "ORDER_FULLY_PAID",
  apl: saleorApp.apl,
  query: "{}",
});

const handler: Handler = async (request) => {
  const saleorApiUrl = request.headers[SALEOR_API_URL_HEADER];
  const klaviyoToken = await getValue(saleorApiUrl as string, "PUBLIC_TOKEN");
  const klaviyoMetric = await getValue(saleorApiUrl as string, "ORDER_FULLY_PAID_METRIC");
  const context = request.params;
  const { userEmail } = context.order;

  if (!userEmail) {
    return Response.BadRequest({ success: false, message: "No user email." });
  }

  const klaviyoClient = Klaviyo(klaviyoToken);
  const klaviyoResponse = await klaviyoClient.send(klaviyoMetric, userEmail, context);

  if (klaviyoResponse.status !== 200) {
    const klaviyoMessage = ` Message: ${(await klaviyoResponse.json())?.message}.` || "";

    return Response.InternalServerError({
      success: false,
      message: `Klaviyo API responded with status ${klaviyoResponse.status}.${klaviyoMessage}`,
    });
  }
  return Response.OK({ success: true, message: "Message sent!" });
};

const wrappedHandler = withSentry(toNextHandler([handler]));

export default orderFullyPaidWebhook.createHandler(wrappedHandler);

export const config = {
  api: {
    bodyParser: false,
  },
};
