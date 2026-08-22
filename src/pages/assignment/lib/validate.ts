import { canSeeField } from "@/lib/permissions";

export type AssignmentBasicErrors = {
  blNo?: string;
  cusdecDate?: string;
  cusdecNo?: string;
  regNo?: string;
  form?: string;
};

export type ContainerFieldErrors = {
  containerNo?: string;
  vocNo?: string;
  lorryId?: string;
  loadingDate?: string;
  demoundDate?: string;
  weight?: string;
  dayHire?: string;
  advanced?: string;
};

function hasDate(value: unknown) {
  if (!value) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return String(value).trim().length > 0;
}

export function validateAssignmentBasic(form: {
  blNo?: string;
  cusdecDate?: string;
  cusdecNo?: string;
  regNo?: string;
}) {
  const errors: AssignmentBasicErrors = {};
  if (!form.blNo?.trim()) errors.blNo = "BL number is required.";
  if (!hasDate(form.cusdecDate)) errors.cusdecDate = "Cusdec date is required.";
  if (!form.cusdecNo?.trim()) errors.cusdecNo = "Cusdec number is required.";
  if (!form.regNo?.trim()) errors.regNo = "Registration number is required.";
  return errors;
}

export function validateContainer(container: {
  containerNo?: string;
  vocNo?: string;
  lorryId?: string | { _id?: string };
  loadingDate?: string | Date;
  demoundDate?: string | Date;
  weight?: number;
  dayHire?: number;
  advanced?: number;
}) {
  const errors: ContainerFieldErrors = {};
  if (!String(container.containerNo || "").trim()) {
    errors.containerNo = "Container number is required.";
  }
  const lorryId =
    typeof container.lorryId === "string"
      ? container.lorryId
      : container.lorryId?._id;
  if (!lorryId) {
    errors.lorryId = "Please select a lorry.";
  }
  if (!hasDate(container.loadingDate)) {
    errors.loadingDate = "Loading date is required.";
  }
  if (!hasDate(container.demoundDate)) {
    errors.demoundDate = "Demount date is required.";
  }
  if (canSeeField("weight") && !(Number(container.weight) > 0)) {
    errors.weight = "Weight must be greater than 0.";
  }
  if (canSeeField("dayHire") && !(Number(container.dayHire) > 0)) {
    errors.dayHire = "Day hire must be greater than 0.";
  }
  if (canSeeField("advanced") && !(Number(container.advanced) > 0)) {
    errors.advanced = "Advanced amount must be greater than 0.";
  }
  return errors;
}

export function firstErrorMessage(
  errors: Record<string, string | undefined>
) {
  return Object.values(errors).find(Boolean);
}

export function mapContainerApiError(message: string): keyof ContainerFieldErrors | "form" {
  if (/container/i.test(message)) return "containerNo";
  if (/voc/i.test(message)) return "vocNo";
  if (/lorry/i.test(message)) return "lorryId";
  if (/loading/i.test(message)) return "loadingDate";
  if (/demount/i.test(message)) return "demoundDate";
  if (/weight/i.test(message)) return "weight";
  if (/day hire/i.test(message)) return "dayHire";
  if (/advanced/i.test(message)) return "advanced";
  return "form";
}
