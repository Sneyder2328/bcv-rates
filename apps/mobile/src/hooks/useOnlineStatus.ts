import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const OnlineStatusContext = createContext<boolean | null>(null);

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Use event-based API instead of useNetInfo() hook to avoid duplicate
    // React copies in pnpm monorepos.
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected =
        (state.isConnected ?? true) && (state.isInternetReachable ?? true);
      setIsOnline(connected);
      onlineManager.setOnline(connected);
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
