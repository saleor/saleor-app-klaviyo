import { NextApiHandler } from "next";

import Klaviyo from "../../lib/klaviyo";

const handler: NextApiHandler = async (request, response) => {
  const { event, recipient, context } = request.body;

  const klaviyo = Klaviyo(process.env.KLAVIYO_TOKEN as string);
  klaviyo.send(event as string, recipient as string, context);

  response.json({ success: true });
};

export default handler;
