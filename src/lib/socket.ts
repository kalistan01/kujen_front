import { io, type Socket } from "socket.io-client";

export type SocketModule =
  | "assignment"
  | "destination"
  | "lorry"
  | "user"
  | "role"
  | "heldup"
  | "log";

export type SocketAction = "created" | "updated" | "deleted";

export type DataChangedPayload<T = any> = {
  module: SocketModule;
  action: SocketAction;
  id: string;
  actorId?: string;
  actorName?: string;
  data: T | null;
};

export function socketOrigin() {
  const api = String(import.meta.env.VITE_API_URL || "");
  if (!api || api.startsWith("/")) return window.location.origin;
  try {
    return new URL(api).origin;
  } catch {
    return window.location.origin;
  }
}

export function createSocket(): Socket {
  return io(socketOrigin(), {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
}

export function entityId(item: { _id?: unknown; id?: unknown } | null | undefined) {
  if (!item) return "";
  return String(item._id || item.id || "");
}

export function upsertById<T extends { _id?: unknown; id?: unknown }>(
  list: T[],
  payload: DataChangedPayload<T>
): T[] {
  const id = String(payload.id || entityId(payload.data));
  if (!id) return list;
  if (payload.action === "deleted" || !payload.data) {
    return list.filter((row) => entityId(row) !== id);
  }
  const index = list.findIndex((row) => entityId(row) === id);
  if (index === -1) return [payload.data, ...list];
  const next = [...list];
  next[index] = { ...next[index], ...payload.data };
  return next;
}
