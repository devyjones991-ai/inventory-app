import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TOTP } from "https://deno.land/x/otpauth@v9.1.1/mod.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const encoder = new TextEncoder();

function canonicalize(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((value) => canonicalize(value));
  }
  if (input && typeof input === "object") {
    const sorted = Object.keys(input as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((input as Record<string, unknown>)[key]);
        return acc;
      }, {});
    return sorted;
  }
  return input;
}

function stringifyPayload(payload: unknown): string {
  if (payload === null || payload === undefined) return "";
  return JSON.stringify(canonicalize(payload));
}

function toBase32(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  while (output.length % 8 !== 0) {
    output += "=";
  }
  return output;
}

async function deriveUserSecret(baseSecret: string, userId: string) {
  const data = encoder.encode(`${baseSecret}:${userId}`);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return toBase32(new Uint8Array(digest));
}

async function createSignatureHash(
  signatureSecret: string,
  userId: string,
  signedAt: string,
  canonicalPayload: string,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signatureSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const message = `${userId}|${signedAt}|${canonicalPayload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const action = typeof body?.action === "string" ? body.action : "verify";
  const payload = body?.payload ?? null;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userError || !user) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const totpBaseSecret = Deno.env.get("SIGNATURE_TOTP_SECRET");
  if (!totpBaseSecret) {
    return jsonResponse({ error: "missing_totp_secret" }, 500);
  }
  const signatureSecret = Deno.env.get("SIGNATURE_SECRET");
  if (!signatureSecret) {
    return jsonResponse({ error: "missing_signature_secret" }, 500);
  }

  const canonicalPayload = stringifyPayload(payload);

  if (action === "verify") {
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code) {
      return jsonResponse({ error: "code_required" }, 400);
    }

    const userSecret = await deriveUserSecret(totpBaseSecret, user.id);
    const totp = new TOTP({
      issuer: Deno.env.get("SIGNATURE_ISSUER") ?? "inventory-app",
      label: user.email ?? user.id,
      secret: userSecret,
      digits: 6,
      period: 30,
      algorithm: "SHA1",
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return jsonResponse({ error: "invalid_code" }, 401);
    }

    const signedAt = new Date().toISOString();
    const signatureHash = await createSignatureHash(
      signatureSecret,
      user.id,
      signedAt,
      canonicalPayload,
    );
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return jsonResponse({
      signedBy: user.id,
      signedAt,
      signatureHash,
      expiresAt,
    });
  }

  if (action === "sign") {
    const signedAt =
      typeof body?.signedAt === "string"
        ? body.signedAt
        : new Date().toISOString();
    const signatureHash = await createSignatureHash(
      signatureSecret,
      user.id,
      signedAt,
      canonicalPayload,
    );
    return jsonResponse({ signedBy: user.id, signedAt, signatureHash });
  }

  return jsonResponse({ error: "unsupported_action" }, 400);
});
