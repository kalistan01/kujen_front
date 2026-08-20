export type AuthUser = {
  _id?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  roleName?: string;
  admin?: boolean;
  permission?: number[];
  denied?: number[];
};

function toIdList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((id) => Number(id)).filter((id) => Number.isFinite(id));
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed === "admin") {
      return {
        admin: true,
        fullName: "Administrator",
        roleName: "admin",
        permission: [],
        denied: [],
      };
    }
    if (parsed && typeof parsed === "object") {
      const roleName = String(parsed.roleName || "").toLowerCase();
      return {
        ...parsed,
        admin: Boolean(parsed.admin) || roleName === "admin",
        permission: toIdList(parsed.permission),
        denied: toIdList(parsed.denied),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function isAdminUser(user = getAuthUser()) {
  return Boolean(user?.admin);
}

export function userInitials(name?: string) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
