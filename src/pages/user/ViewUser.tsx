import { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Monitor, Smartphone, Tablet } from "lucide-react";

export type LoginDevice = {
  device?: string;
  userAgent?: string;
  ip?: string;
  lastLoginAt?: string | null;
  lastSeen?: string | null;
};

export type DirectoryUser = {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  status: boolean;
  roleId?: string;
  roleName: string;
  createdAt?: string;
  updatedAt?: string;
  lastSeen?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  lastLoginUserAgent?: string;
  loginDevices?: LoginDevice[];
  online?: boolean;
};

export function userDevices(user?: DirectoryUser | null): LoginDevice[] {
  const list = Array.isArray(user?.loginDevices) ? user.loginDevices : [];
  if (list.length) {
    return [...list].sort(
      (a, b) =>
        new Date(b.lastLoginAt || 0).getTime() -
        new Date(a.lastLoginAt || 0).getTime()
    );
  }
  if (user?.lastLoginDevice) {
    return [
      {
        device: user.lastLoginDevice,
        userAgent: user.lastLoginUserAgent,
        ip: user.lastLoginIp,
        lastLoginAt: user.lastLoginAt,
        lastSeen: user.lastSeen,
      },
    ];
  }
  return [];
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLastSeen(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  const diff = Date.now() - date.getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateTime(value);
}

export function userInitials(name?: string) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function DeviceIcon({ device }: { device?: string }) {
  const value = String(device || "").toLowerCase();
  if (value.includes("mobile")) return <Smartphone className="h-3.5 w-3.5" />;
  if (value.includes("tablet")) return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
}

export function DeviceLabel({
  device,
  empty = "—",
}: {
  device?: string;
  empty?: string;
}) {
  if (!device) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <DeviceIcon device={device} />
      <span>{device}</span>
    </span>
  );
}

export function DeviceList({
  user,
  empty = "No login yet",
}: {
  user?: DirectoryUser | null;
  empty?: string;
}) {
  const devices = userDevices(user);
  if (!devices.length) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {devices.map((item, index) => (
        <DeviceLabel
          key={`${item.device || "device"}-${index}`}
          device={item.device}
        />
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-border/60 py-2.5 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function ViewUser({ user }: { user: DirectoryUser }) {
  const devices = userDevices(user);

  return (
    <div className="space-y-1">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">
          {userInitials(user.fullName)}
        </span>
        <div>
          <p className="text-lg font-semibold leading-tight">{user.fullName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Row label="Role">
        <Badge variant="secondary">{user.roleName || "—"}</Badge>
      </Row>
      <Row label="Account">
        <StatusBadge status={user.status} />
      </Row>
      <Row label="Presence">
        {user.online ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        ) : (
          <span className="text-muted-foreground">
            Last seen {formatLastSeen(user.lastSeen)}
          </span>
        )}
      </Row>
      <Row label="Devices">
        {devices.length ? (
          <div className="space-y-3">
            {devices.map((item, index) => (
              <div
                key={`${item.device || "device"}-${index}`}
                className="rounded-md border border-border/60 p-2.5"
              >
                <DeviceLabel device={item.device} empty="Unknown device" />
                <p className="mt-1.5 text-xs font-normal text-muted-foreground">
                  Last login {formatDateTime(item.lastLoginAt)}
                  {item.ip ? ` · ${item.ip}` : ""}
                </p>
                {item.userAgent ? (
                  <p className="mt-1 break-all text-[11px] font-normal text-muted-foreground">
                    {item.userAgent}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">No login yet</span>
        )}
      </Row>
      <Row label="Created">{formatDateTime(user.createdAt)}</Row>
      <Row label="Updated">{formatDateTime(user.updatedAt)}</Row>
    </div>
  );
}
