import type { Handler } from "retes";
import { Response } from "retes/response";
import { toNextHandler } from "retes/adapter";
import {
  withSaleorEventMatch,
  withWebhookSignatureVerified,
} from "@saleor/app-sdk/middleware";
import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";

import { getValue } from "../../../lib/metadata";
import Klaviyo from "../../../lib/klaviyo";
import { withSaleorDomainMatch } from "../../../lib/middlewares";

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];
  const klaviyoToken = await getValue(saleorDomain, "PUBLIC_TOKEN");
  const klaviyoMetric = await getValue(
    saleorDomain,
    "FULFILLMENT_CREATED_METRIC"
  );
  const context = request.params;
  const userEmail = context.order.userEmail;

  if (!userEmail) {
    return Response.BadRequest({ success: false, message: "No user email." });
  }

  const klaviyoClient = Klaviyo(klaviyoToken);
  klaviyoClient.send(klaviyoMetric, userEmail, context);

  return Response.OK({ success: true, message: "Message sent!" });
};

export default toNextHandler([
  withSaleorDomainMatch,
  withSaleorEventMatch("fulfillment_created"),
  withWebhookSignatureVerified(),
  handler,
]);

export const config = {
  api: {
    bodyParser: false,
  },
};
