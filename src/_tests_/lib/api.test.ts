import assert from "node:assert/strict";
import test from "node:test";
import { getApiBaseUrl } from "../../lib/api.ts";

function withEnv(
  values: Record<string, string | undefined>,
  fn: () => void
): void {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("getApiBaseUrl returns trimmed NEXT_PUBLIC_API_BASE_URL when provided", () => {
  withEnv(
    {
      NEXT_PUBLIC_API_BASE_URL: "  https://api.matup.app  ",
      NODE_ENV: "development",
    },
    () => {
      assert.equal(getApiBaseUrl(), "https://api.matup.app");
    }
  );
});

test("getApiBaseUrl falls back to localhost in non-production environments", () => {
  withEnv(
    {
      NEXT_PUBLIC_API_BASE_URL: undefined,
      NODE_ENV: "development",
    },
    () => {
      assert.equal(getApiBaseUrl(), "http://localhost:3001");
    }
  );
});

test("getApiBaseUrl throws in production when NEXT_PUBLIC_API_BASE_URL is missing", () => {
  withEnv(
    {
      NEXT_PUBLIC_API_BASE_URL: undefined,
      NODE_ENV: "production",
    },
    () => {
      assert.throws(
        () => getApiBaseUrl(),
        /NEXT_PUBLIC_API_BASE_URL must be set in production/
      );
    }
  );
});
