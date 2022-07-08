import type { Handler } from "retes";

import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";
import { inferWebhooks } from "@saleor/app-sdk";
import { withBaseURL } from "@saleor/app-sdk/middleware";

import { version, name } from "../../package.json";
import * as GeneratedGraphQL from "../../generated/graphql";

const handler: Handler = async (request) => {
  const { baseURL } = request.context;

  const webhooks = await inferWebhooks(
    baseURL,
    `${__dirname}/webhooks`,
    GeneratedGraphQL
  );

  const manifest = {
    id: "saleor.app.klaviyo",
    version: version,
    name: name,
    permissions: ["MANAGE_USERS", "MANAGE_ORDERS"],
    appUrl: baseURL,
    tokenTargetUrl: `${baseURL}/api/register`,
    webhooks,
  };

  return Response.OK(manifest);
};

export default toNextHandler([withBaseURL, handler]);
