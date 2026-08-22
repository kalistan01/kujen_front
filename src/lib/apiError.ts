export function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    message?: string;
    response?: {
      status?: number;
      data?: { message?: string; error?: string };
    };
  };
  const status = err?.response?.status;
  const message =
    err?.response?.data?.message || err?.response?.data?.error || err?.message;

  if (status === 403) {
    return typeof message === "string" && message.trim()
      ? message
      : "You do not have permission to do this.";
  }

  if (typeof message !== "string" || !message.trim()) return fallback;

  if (message.includes("E11000") || /duplicate key/i.test(message)) {
    const roleMatch = message.match(/roleName["']?\s*[:=]\s*"?([^"}\s,]+)/i);
    if (roleMatch) return `Role name "${roleMatch[1]}" already exists.`;

    const lorryMatch = message.match(/lorryNum["']?\s*[:=]\s*"?([^"}\s,]+)/i);
    if (lorryMatch) {
      return `Lorry number "${lorryMatch[1]}" is already registered.`;
    }

    const emailMatch = message.match(/email["']?\s*[:=]\s*"?([^"}\s,]+)/i);
    if (emailMatch) {
      return `A user with email "${emailMatch[1]}" already exists.`;
    }

    return "This value is already registered.";
  }

  if (message === "Network Error") {
    return "Unable to reach the server. Check your connection and try again.";
  }

  if (message === "Something went wrong" || message === "Server Error") {
    return fallback;
  }

  return message;
}
