import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/const";
import { createProtectedHandler, NextProtectedApiHandler } from "@saleor/app-sdk/handlers/next";
import snakeCase from "lodash.snakecase";

import {
  FetchAppDetailsDocument,
  MetadataInput,
  MetadataItem,
  UpdateAppMetadataDocument,
} from "../../generated/graphql";
import { createClient } from "../../lib/graphql";
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

const handler: NextProtectedApiHandler = async (request, res, ctx) => {
  const saleorApiUrl = request.headers[SALEOR_API_URL_HEADER] as string;
  const { authData } = ctx;

  if (!authData) {
    console.debug(`Could not find auth data for the domain ${saleorApiUrl}.`);
    return res.status(403).end();
  }

  const client = createClient(authData.saleorApiUrl, async () =>
    Promise.resolve({ token: authData.token })
  );

  let privateMetadata;
  switch (request.method!) {
    case "GET":
      privateMetadata = (await client.query(FetchAppDetailsDocument).toPromise()).data?.app
        ?.privateMetadata!;

      return res.json({
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

      return res.json({
        success: true,
        data: prepareResponseFromMetadata(privateMetadata),
      });
    }
    default:
      return res.status(405).end();
  }
};

// export default withSentry(createProtectedHandler(handler, saleorApp.apl));
export default createProtectedHandler(handler, saleorApp.apl);
