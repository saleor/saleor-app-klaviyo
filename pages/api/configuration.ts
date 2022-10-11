import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import {
  withJWTVerified,
  withRegisteredSaleorDomainHeader,
  withSaleorApp,
} from "@saleor/app-sdk/middleware";
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
import { apl } from "../../lib/apl";
import { createClient } from "../../lib/graphql";
import { getAppIdFromApi } from "../../lib/utils";
import { saleorApp } from "../../saleor-app";

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
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER] as string;
  const authData = await apl.get(saleorDomain);

  if (!authData) {
    console.debug(`Could not find auth data for the domain ${saleorDomain}.`);
    return Response.Forbidden();
  }

  const client = createClient(`https://${saleorDomain}/graphql/`, async () =>
    Promise.resolve({ token: authData.token })
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
  toNextHandler([
    withSaleorApp(saleorApp),
    withRegisteredSaleorDomainHeader,
    withJWTVerified(getAppIdFromApi),
    handler,
  ])
);
