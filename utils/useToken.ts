import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import jwt, { JwtPayload } from "jsonwebtoken";
import { useMemo } from "react";

interface DashboardTokenPayload extends JwtPayload {
  app: string;
}
interface TokenProps {
  isTokenValid: boolean;
  hasAppToken: boolean;
  tokenClaims: DashboardTokenPayload | null;
}

const useToken = (): TokenProps => {
  const { appBridgeState } = useAppBridge();

  const tokenClaims = useMemo(() => {
    try {
      return jwt.decode(appBridgeState?.token as string) as DashboardTokenPayload;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [appBridgeState]);

  const isTokenValid = tokenClaims ? tokenClaims.iss === appBridgeState?.domain : false;

  return {
    isTokenValid,
    tokenClaims,
    hasAppToken: !!appBridgeState?.token,
  };
};

export default useToken;
