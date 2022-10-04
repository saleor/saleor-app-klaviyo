import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import { withJWTVerified } from "@saleor/app-sdk/middleware";
import { withSentry } from "@sentry/nextjs";
import snakeCase from "lodash.snakecase";
import type { Handler } from "retes";
import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";

import {
  FetchAppDetailsDocument,
  MetadataInput,
  MetadataItem,
  UpdateAppMetadataDocument,
} from "../../generated/graphql";
import { getEnvVars } from "../../lib/environment";
import { createClient } from "../../lib/graphql";
import { withSaleorDomainMatch } from "../../lib/middlewares";
import { getAppIdFromApi } from "../../lib/utils";

const CONFIGURATION_KEYS = [
  "PUBLIC_TOKEN",
  "CUSTOMER_CREATED_METRIC",
  "FULFILLMENT_CREATED_METRIC",
  "ORDER_CREATED_METRIC",
  "ORDER_FULLY_PAID_METRIC",
];

const prepareMetadataFromRequest = (input: MetadataInput[] | MetadataItem[]) =>
  input
    .filter(({ key }) => CONFIGURATION_KEYS.includes(key))
    .map(({ key, value }) => ({ key, value }));

const prepareResponseFromMetadata = (input: MetadataItem[]) => {
  const output: MetadataInput[] = CONFIGURATION_KEYS.map(
    (configurationKey) =>
      input.find(({ key }) => key === configurationKey) ?? {
        key: configurationKey,
        value: "",
      }
  ).map((formattedInput) => {
    if (formattedInput.key === "PUBLIC_TOKEN") {
      return formattedInput;
    }
    if (formattedInput.value === "") {
      return {
        value: `SALEOR_${snakeCase(formattedInput.key).toUpperCase()}`,
        key: formattedInput.key,
      };
    }

    return formattedInput;
  });

  return output.map(({ key, value }) => ({ key, value }));
};

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];

  const client = createClient(`https://${saleorDomain}/graphql/`, async () =>
    Promise.resolve({ token: (await getEnvVars()).SALEOR_AUTH_TOKEN })
  );

  let privateMetadata;
  switch (request.method!) {
    case "GET":
      privateMetadata = (await client.query(FetchAppDetailsDocument).toPromise()).data?.app
        ?.privateMetadata!;

      return Response.OK({
        success: true,
        data: prepareResponseFromMetadata(privateMetadata),
      });
    case "POST": {
      const appId = (await client.query(FetchAppDetailsDocument).toPromise()).data?.app?.id;

      privateMetadata = (
        await client
          .mutation(UpdateAppMetadataDocument, {
            id: appId as string,
            input: prepareMetadataFromRequest((request.body as any).data),
          })
          .toPromise()
      ).data?.updatePrivateMetadata?.item?.privateMetadata!;

      return Response.OK({
        success: true,
        data: prepareResponseFromMetadata(privateMetadata),
      });
    }
    default:
      return Response.MethodNotAllowed();
  }
};

export default withSentry(
  toNextHandler([withSaleorDomainMatch, withJWTVerified(getAppIdFromApi), handler])
);
