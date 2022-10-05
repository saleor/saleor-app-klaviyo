import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import { withSaleorEventMatch, withWebhookSignatureVerified } from "@saleor/app-sdk/middleware";
import { withSentry } from "@sentry/nextjs";
import type { Handler } from "retes";
import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";

import Klaviyo from "../../../lib/klaviyo";
import { getValue } from "../../../lib/metadata";
import { withSaleorDomainMatch } from "../../../lib/middlewares";

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];
  const klaviyoToken = await getValue(saleorDomain as string, "PUBLIC_TOKEN");
  const klaviyoMetric = await getValue(saleorDomain as string, "FULFILLMENT_CREATED_METRIC");
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

export default withSentry(
  toNextHandler([
    withSaleorDomainMatch,
    withSaleorEventMatch("fulfillment_created"),
    withWebhookSignatureVerified(),
    handler,
  ])
);

export const config = {
  api: {
    bodyParser: false,
  },
};
