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

function isPresenceOnly(data: unknown) {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  const keys = Object.keys(record).filter((key) => record[key] !== undefined);
  if (!keys.length) return false;
  return keys.every(
    (key) => key === "_id" || key === "id" || key === "online" || key === "lastSeen"
  );
}

function tabIsVisible() {
  return document.visibilityState === "visible";
}

function syncPresence(socket: Socket, visible: boolean) {
  const query = (socket.io?.opts?.query || {}) as Record<string, string>;
  if (socket.io?.opts) {
    socket.io.opts.query = { ...query, active: visible ? "1" : "0" };
  }
  socket.emit(visible ? "presence:active" : "presence:idle");
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
        if (isPresenceOnly(payload.data)) return;
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

    const reportVisibility = () => {
      syncPresence(next, tabIsVisible());
    };

    const onHidden = () => {
      syncPresence(next, false);
    };

    next.on("data:changed", onChanged);
    next.on("connect", reportVisibility);
    if (next.connected) reportVisibility();
    document.addEventListener("visibilitychange", reportVisibility);
    window.addEventListener("pagehide", onHidden);

    return () => {
      next.off("data:changed", onChanged);
      next.off("connect", reportVisibility);
      document.removeEventListener("visibilitychange", reportVisibility);
      window.removeEventListener("pagehide", onHidden);
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
