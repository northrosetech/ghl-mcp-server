// GHL API Client Service
// ======================
// Centralized HTTP client with auth, rate limiting, pagination, and error handling

import { GHL_BASE_URL, GHL_API_VERSION, GHL_API_KEY, GHL_LOCATION_ID, CHARACTER_LIMIT, RATE_LIMIT } from "../constants.js";
import type { HttpMethod, GHLApiResponse } from "../types.js";

// Simple in-memory rate limiter
class RateLimiter {
  private burstTokens: number[] = [];
  private dailyCount = 0;
  private dailyResetTime = Date.now() + 86_400_000;

  canProceed(): boolean {
    const now = Date.now();

    // Reset daily counter
    if (now > this.dailyResetTime) {
      this.dailyCount = 0;
      this.dailyResetTime = now + 86_400_000;
    }

    // Check daily limit
    if (this.dailyCount >= RATE_LIMIT.dailyMax) {
      return false;
    }

    // Clean burst window
    this.burstTokens = this.burstTokens.filter(
      (t) => now - t < RATE_LIMIT.burstWindowMs
    );

    // Check burst limit
    if (this.burstTokens.length >= RATE_LIMIT.burstMax) {
      return false;
    }

    this.burstTokens.push(now);
    this.dailyCount++;
    return true;
  }

  getWaitTime(): number {
    if (this.burstTokens.length >= RATE_LIMIT.burstMax) {
      const oldest = this.burstTokens[0];
      return RATE_LIMIT.burstWindowMs - (Date.now() - oldest) + 100;
    }
    return 0;
  }
}

const rateLimiter = new RateLimiter();

// Validate configuration on import
function validateConfig(): void {
  if (!GHL_API_KEY || GHL_API_KEY === "your_private_integration_token_here") {
    console.error(
      "⚠️  GHL_API_KEY is not configured. Set it in your .env file or environment variables."
    );
  }
  if (!GHL_LOCATION_ID || GHL_LOCATION_ID === "your_location_id_here") {
    console.error(
      "⚠️  GHL_LOCATION_ID is not configured. Set it in your .env file or environment variables."
    );
  }
}

validateConfig();

/**
 * Make an authenticated request to the GHL API
 */
export async function ghlRequest<T = unknown>(
  endpoint: string,
  method: HttpMethod = "GET",
  body?: Record<string, unknown>,
  queryParams?: Record<string, string | number | boolean | undefined>
): Promise<GHLApiResponse<T>> {
  // Rate limiting
  if (!rateLimiter.canProceed()) {
    const waitTime = rateLimiter.getWaitTime();
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    if (!rateLimiter.canProceed()) {
      throw new GHLApiError(
        "Rate limit exceeded. GHL allows 100 requests per 10 seconds and 200K per day. Try again shortly.",
        429
      );
    }
  }

  // Build URL with query params
  let url = `${GHL_BASE_URL}${endpoint}`;

  // Replace {locationId} placeholder in endpoints
  url = url.replace("{locationId}", GHL_LOCATION_ID);

  if (queryParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    }
    const paramString = params.toString();
    if (paramString) {
      url += `?${paramString}`;
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${GHL_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    Version: GHL_API_VERSION,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      if (!response.ok) {
        throw new GHLApiError(
          `GHL API returned ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      return { data: { success: true } as unknown as T };
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new GHLApiError(errorMsg, response.status, data);
    }

    return data as GHLApiResponse<T>;
  } catch (error) {
    if (error instanceof GHLApiError) throw error;

    const errMsg = error instanceof Error ? error.message : String(error);
    throw new GHLApiError(`Network error calling GHL API: ${errMsg}`, 0);
  }
}

/**
 * Custom error class for GHL API errors
 */
export class GHLApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseData?: unknown
  ) {
    super(message);
    this.name = "GHLApiError";
  }
}

/**
 * Format API response for MCP tool output
 */
export function formatToolResponse(
  data: unknown,
  format: "json" | "markdown" = "json"
): string {
  const jsonStr = JSON.stringify(data, null, 2);

  if (jsonStr.length > CHARACTER_LIMIT) {
    const truncated = jsonStr.substring(0, CHARACTER_LIMIT);
    return `${truncated}\n\n--- TRUNCATED (${jsonStr.length} chars total, showing first ${CHARACTER_LIMIT}). Use pagination or filters to narrow results. ---`;
  }

  return jsonStr;
}

/**
 * Format error for MCP tool output
 */
export function formatErrorResponse(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  let message: string;

  if (error instanceof GHLApiError) {
    message = `Error (${error.statusCode}): ${error.message}`;
    if (error.statusCode === 401) {
      message += "\n\nHint: Check your GHL_API_KEY. Make sure you're using a Private Integration Token, not a regular API key.";
    } else if (error.statusCode === 403) {
      message += "\n\nHint: Your Private Integration Token may not have the required scopes. Edit it in GHL Settings → Private Integrations.";
    } else if (error.statusCode === 404) {
      message += "\n\nHint: The resource was not found. Check the ID and locationId.";
    } else if (error.statusCode === 422) {
      message += "\n\nHint: Validation error. Check the required fields and data formats.";
      if (error.responseData) {
        message += `\nDetails: ${JSON.stringify(error.responseData)}`;
      }
    } else if (error.statusCode === 429) {
      message += "\n\nHint: Rate limit hit. Wait a few seconds and try again.";
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

/**
 * Helper to get the default locationId
 */
export function getLocationId(providedId?: string): string {
  return providedId || GHL_LOCATION_ID;
}
