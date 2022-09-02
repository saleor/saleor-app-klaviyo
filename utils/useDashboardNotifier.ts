import { actions, NotificationPayload } from "@saleor/app-sdk/app-bridge";

import useApp from "../hooks/useApp";

const useDashboardNotifier = () => {
  const app = useApp();
  const notify = (payload: NotificationPayload) => {
    return app?.getState()?.ready && app?.dispatch(actions.Notification(payload));
  };

  return [notify];
};

export default useDashboardNotifier;
