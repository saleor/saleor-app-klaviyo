import { NextApiHandler } from "next";
import { print } from "graphql/language/printer";

import { version, name } from "../../package.json";
import { getBaseURL } from "../../lib/middlewares";
import {
  CustomerCreatedSubscriptionDocument,
  FulfillmentCreatedSubscriptionDocument,
  OrderCreatedSubscriptionDocument,
  OrderFullyPaidSubscriptionDocument,
} from "../../generated/graphql";

const handler: NextApiHandler = async (request, response) => {
  const baseURL = getBaseURL(request);

  const manifest = {
    id: "saleor.app.klaviyo",
    version: version,
    name: name,
    permissions: ["MANAGE_USERS", "MANAGE_ORDERS"],
    configurationUrl: `${baseURL}/configuration`,
    tokenTargetUrl: `${baseURL}/api/register`,
    webhooks: [
      {
        name: "order-created",
        asyncEvents: ["ORDER_CREATED"],
        query: print(OrderCreatedSubscriptionDocument),
        targetUrl: `${baseURL}/api/webhooks/order-created`,
        isActive: true,
      },
      {
        name: "order-fully-paid",
        asyncEvents: ["ORDER_FULLY_PAID"],
        query: print(OrderFullyPaidSubscriptionDocument),
        targetUrl: `${baseURL}/api/webhooks/order-fully-paid`,
        isActive: true,
      },
      {
        name: "customer-created",
        asyncEvents: ["CUSTOMER_CREATED"],
        query: print(CustomerCreatedSubscriptionDocument),
        targetUrl: `${baseURL}/api/webhooks/customer-created`,
        isActive: true,
      },
      {
        name: "fulfillment-created",
        asyncEvents: ["FULFILLMENT_CREATED"],
        query: print(FulfillmentCreatedSubscriptionDocument),
        targetUrl: `${baseURL}/api/webhooks/fulfillment-created`,
        isActive: true,
      },
    ],
  };

  response.json(manifest);
}

export default handler;
