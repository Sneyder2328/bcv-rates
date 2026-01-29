import NetInfo, {
  type NetInfoState,
  useNetInfo,
} from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";

function deriveIsOnline(
  state: Pick<NetInfoState, "isConnected" | "isInternetReachable">,
) {
  // `isInternetReachable` is often `null` on first render; treat unknown as online so
  // we don't pessimistically disable queries at startup.
  const isConnected = state.isConnected ?? true;
  const isInternetReachable = state.isInternetReachable ?? true;
  return isConnected && isInternetReachable;
}

const OnlineStatusContext = createContext<boolean | null>(null);

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const netInfo = useNetInfo();
  const isOnline = useMemo(() => deriveIsOnline(netInfo), [netInfo]);

  useEffect(() => {
    // Bridge React Query's onlineManager to React Native's NetInfo.
    onlineManager.setOnline(isOnline);
  }, [isOnline]);

  useEffect(() => {
    // Keep onlineManager updated even if nobody consumes this context,
    // and ensure we unsubscribe on unmount.
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      onlineManager.setOnline(deriveIsOnline(state));
    });
    return unsubscribe;
  }, []);

  return createElement(
    OnlineStatusContext.Provider,
    { value: isOnline },
    children,
  );
}

export function useOnlineStatus() {
  const value = useContext(OnlineStatusContext);
  if (value === null) {
    throw new Error(
      "useOnlineStatus must be used within an OnlineStatusProvider",
    );
  }
  return value;
}
