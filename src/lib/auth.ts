export type AuthUser = {
  _id?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  roleName?: string;
  admin?: boolean;
};

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
      };
    }
    if (parsed && typeof parsed === "object") {
      const roleName = String(parsed.roleName || "").toLowerCase();
      return {
        ...parsed,
        admin: Boolean(parsed.admin) || roleName === "admin",
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
