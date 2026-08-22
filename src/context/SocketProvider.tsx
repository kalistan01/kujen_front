import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { createSocket, type DataChangedPayload } from "@/lib/socket";
import { getAuthUser } from "@/lib/auth";

const API_URL = import.meta.env.VITE_API_URL;

const SocketContext = createContext<Socket | null>(null);

function isInactiveStatus(value: unknown) {
  return (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  );
}

async function refreshAuthUser() {
  const response = await fetch(`${API_URL}/auth/check`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }
  const data = await response.json();
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
}

function forceLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const next = createSocket();
    setSocket(next);

    const onChanged = (payload: DataChangedPayload) => {
      const me = getAuthUser();
      if (!me?._id || !payload) return;

      if (payload.module === "user" && String(payload.id) === String(me._id)) {
        if (payload.action === "deleted" || isInactiveStatus(payload.data?.status)) {
          forceLogout();
          return;
        }
        refreshAuthUser().catch(() => {});
        return;
      }

      if (
        payload.module === "role" &&
        payload.data &&
        String(payload.id) === String(me.roleId)
      ) {
        refreshAuthUser().catch(() => {});
      }
    };

    next.on("data:changed", onChanged);

    return () => {
      next.off("data:changed", onChanged);
      next.disconnect();
      setSocket(null);
    };
  }, []);

  const value = useMemo(() => socket, [socket]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
