import { useEffect, useRef } from "react";
import { useSocket } from "@/context/SocketProvider";
import { getAuthUser } from "@/lib/auth";
import type { DataChangedPayload, SocketModule } from "@/lib/socket";

export function useEntitySync(
  modules: SocketModule | SocketModule[],
  onChange: (payload: DataChangedPayload) => void
) {
  const socket = useSocket();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const moduleKey = Array.isArray(modules) ? modules.join(",") : modules;

  useEffect(() => {
    if (!socket) return;
    const wanted = new Set(
      (Array.isArray(modules) ? modules : [modules]).filter(Boolean)
    );

    const handler = (payload: DataChangedPayload) => {
      if (!payload?.module || !wanted.has(payload.module)) return;
      const me = getAuthUser()?._id;
      if (me && payload.actorId && String(payload.actorId) === String(me)) {
        return;
      }
      onChangeRef.current(payload);
    };

    socket.on("data:changed", handler);
    return () => {
      socket.off("data:changed", handler);
    };
  }, [socket, moduleKey]);
}
