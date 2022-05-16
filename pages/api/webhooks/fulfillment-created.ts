import { NextApiHandler } from "next";
import Klaviyo from "../../../lib/klaviyo";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";

const expectedEvent = "fulfillment_created";

const handler: NextApiHandler = async (request, response) => {
  console.log(request.body);

  try {
    webhookMiddleware(request, expectedEvent);
  } catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error);
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }

  console.info("Middleware checks were successful!");

  const receivedEvent = request.headers["saleor-event"]?.toString();

  console.info("Received event - ", receivedEvent);

  if (receivedEvent !== expectedEvent) {
    response.status(400).json({ success: false, message: "Invalid event" });
    return;
  }

  const context = request.body;
  const userEmail = context[0]?.user_email;

  if (!userEmail) {
    response.status(400).json({ success: false, message: "No user email" });
    return;
  }

  const klaviyoClient = Klaviyo(process.env.KLAVIYO_TOKEN as string);

  klaviyoClient.send(receivedEvent, userEmail, context);

  response.json({ success: true, message: "Message sent!" });
  return;
};

export default handler;
