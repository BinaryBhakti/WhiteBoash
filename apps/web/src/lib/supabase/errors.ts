type SupabaseLikeError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "Unknown database error.";
  }

  return "Unknown database error.";
}

export function isMissingSupabaseSchemaError(error: unknown) {
  const supabaseError = error as SupabaseLikeError | undefined;
  const message = getErrorMessage(error).toLowerCase();
  const code = supabaseError?.code?.toLowerCase();

  return (
    code === "pgrst205" ||
    code === "42p01" ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("relation") && message.includes("does not exist")
  );
}
