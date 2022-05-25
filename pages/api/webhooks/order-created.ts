import { NextApiHandler } from "next";
import Klaviyo from "../../../lib/klaviyo";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";
import { getValue } from "../../../lib/metadata";

const expectedEvent = "order_created";

const handler: NextApiHandler = async (request, response) => {
  console.log(request.body);

  let saleorDomain;
  try {
    saleorDomain = webhookMiddleware(request, expectedEvent) as string;
  } catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error);
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }

  console.info("Middleware checks were successful!");
  console.info("Received event - ", expectedEvent);

  const klaviyoToken = await getValue(saleorDomain, "PUBLIC_TOKEN");
  const klaviyoMetric = await getValue(saleorDomain, "ORDER_CREATED_METRIC");
  const context = request.body;
  const userEmail = context.order.userEmail;

  if (!userEmail) {
    response.status(400).json({ success: false, message: "No user email" });
    return;
  }

  const klaviyoClient = Klaviyo(klaviyoToken);
  klaviyoClient.send(klaviyoMetric, userEmail, context);

  response.json({ success: true, message: "Message sent!" });
  return;
};

export default handler;
