import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import { withSaleorDomainPresent } from "@saleor/app-sdk/middleware";
import type { Middleware } from "retes";
import { Response } from "retes/response";

import { apl } from "./apl";

export const withSaleorDomainMatch: Middleware = (handler) =>
  withSaleorDomainPresent(async (request) => {
    const { [SALEOR_DOMAIN_HEADER]: saleorDomain } = request.headers;

    const authData = await apl.get(saleorDomain as string);
    if (!authData) {
      throw Error(`Couldn't find auth data for domain ${saleorDomain}`);
    }

    if (authData.domain === undefined) {
      return Response.InternalServerError({
        success: false,
        message: "Missing SALEOR_DOMAIN environment variable.",
      });
    }

    if (authData.domain !== request.headers[SALEOR_DOMAIN_HEADER]) {
      return Response.BadRequest({
        success: false,
        message: `Invalid ${SALEOR_DOMAIN_HEADER} header.`,
      });
    }

    return handler(request);
  });
