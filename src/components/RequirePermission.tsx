import { Navigate } from "react-router-dom";
import { canAny, canSeeField } from "@/lib/permissions";

export function Can({
  id,
  children,
}: {
  id: number | number[];
  children: React.ReactNode;
}) {
  const ids = Array.isArray(id) ? id : [id];
  if (!canAny(ids)) return null;
  return <>{children}</>;
}

export function FieldGate({
  field,
  children,
}: {
  field: string;
  children: React.ReactNode;
}) {
  if (!canSeeField(field)) return null;
  return <>{children}</>;
}

function RequirePermission({
  ids,
  children,
}: {
  ids: number[];
  children: React.ReactNode;
}) {
  if (!canAny(ids)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default RequirePermission;

