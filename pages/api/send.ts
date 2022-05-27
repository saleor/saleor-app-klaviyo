import { NextApiHandler } from "next";

import Klaviyo from "../../lib/klaviyo";
import { getValue } from "../../lib/metadata";
import { domainMiddleware } from "../../lib/middlewares";
import MiddlewareError from "../../utils/MiddlewareError";

const handler: NextApiHandler = async (request, response) => {
  let saleorDomain: string, klaviyoToken: string;
  const { event, recipient, context } = request.body;

  try {
    saleorDomain = domainMiddleware(request) as string;
  }
  catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error);
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }

  try {
    klaviyoToken = await getValue(saleorDomain, "PUBLIC_TOKEN");
  } catch (e: unknown) {
    const error = e as Error;

    console.error(error);
    response
      .status(500)
      .json({ success: false, message: error.message });
    return;
  }

  const klaviyo = Klaviyo(klaviyoToken);
  klaviyo.send(event as string, recipient as string, context);

  response.json({ success: true });
};

export default handler;
