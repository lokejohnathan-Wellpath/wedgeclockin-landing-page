export function customerSafeMessage(
  error: unknown,
  fallback = "Request failed.",
) {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : fallback;

  if (/founder john/i.test(message)) {
    return "Package pricing has not been published yet.";
  }

  return message || fallback;
}
