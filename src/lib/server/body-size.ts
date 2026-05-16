import { NextRequest, NextResponse } from "next/server";

/**
 * Safely reads and parses a JSON body while enforcing a byte-size limit.
 *
 * Problem it solves:
 *   – Content-Length can be absent or spoofed for chunked requests.
 *   – Calling `request.json()` without a size guard lets attackers stream
 *     unlimited data into memory (DoS).
 *
 * This helper:
 *   1. Fast-rejects if Content-Length is present and > maxBytes.
 *   2. Reads the raw ArrayBuffer and rejects if it exceeds maxBytes.
 *   3. Parses JSON and returns the value.
 *
 * Usage:
 *   const body = await readJsonBody(req, 8_192);
 *   if (!body.ok) return body.response;
 *   const data = body.data as MyType;
 */
export async function readJsonBody<T = unknown>(
  req: NextRequest,
  maxBytes: number
): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }
> {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const len = parseInt(contentLength, 10);
    if (!Number.isNaN(len) && len > maxBytes) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Payload too large" },
          { status: 413 }
        ),
      };
    }
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await req.arrayBuffer();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unable to read body" },
        { status: 400 }
      ),
    };
  }

  if (buffer.byteLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      ),
    };
  }

  try {
    const text = new TextDecoder().decode(buffer);
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      ),
    };
  }
}
