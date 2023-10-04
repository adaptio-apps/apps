import { TokenBaseSalesforce } from "./types.ts";
import { AppContext } from "../mod.ts";
import { encode } from "https://esm.sh/he@1.2.0";

export interface Props {
  grantType: string;
  refreshToken?: string;
}

export default async function authApi(
  props: Props,
  ctx: AppContext,
): Promise<null | TokenBaseSalesforce> {
  const { grantType, refreshToken } = props;

  const { slc, organizationId, clientId, clientSecret } = ctx;

  const response = await slc
    ["POST /shopper/auth/v1/organizations/:organizationId/oauth2/token"](
      {
        organizationId,
      },
      {
        body: {
          grant_type: grantType,
          refresh_token: refreshToken,
        },
        headers: {
          Authorization: `Basic ${encode(clientId + ":" + clientSecret)}`,
        },
      },
    );

  return response.json();
}
