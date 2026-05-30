type LogLevel = "info" | "warn" | "error";

type LogDetails = Record<string, unknown>;

export function log(level: LogLevel, event: string, details: LogDetails = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "collab",
    event,
    ...details,
  };

  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function errorDetails(error: unknown) {
  return {
    message: error instanceof Error ? error.message : "Unknown error",
  };
}
