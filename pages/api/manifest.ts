import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { inferWebhooks } from "@saleor/app-sdk/infer-webhooks";
import { AppManifest } from "@saleor/app-sdk/types";
import { withSentry } from "@sentry/nextjs";

import * as GeneratedGraphQL from "../../generated/graphql";
import { name, version } from "../../package.json";

const handler = createManifestHandler({
  async manifestFactory(context): Promise<AppManifest> {
    const { appBaseUrl } = context;

    const webhooks = await inferWebhooks(appBaseUrl, `${__dirname}/webhooks`, GeneratedGraphQL);

    return {
      id: "saleor.app.klaviyo",
      version,
      name,
      permissions: ["MANAGE_USERS", "MANAGE_ORDERS"],
      appUrl: appBaseUrl,
      tokenTargetUrl: `${appBaseUrl}/api/register`,
      webhooks,
    };
  },
});

export default withSentry(handler);
