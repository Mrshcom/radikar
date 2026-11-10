import { createHmac, timingSafeEqual } from "node:crypto";

function signature(uuid: string, userId: string, secret: string) {
  return createHmac("sha256", secret).update(`interview:${userId}:${uuid}`).digest("base64url");
}

export function signInterviewChat(uuid: string, userId: string, secret: string) {
  return `${uuid}.${signature(uuid, userId, secret)}`;
}

export function verifyInterviewChat(token: string, userId: string, secret: string) {
  const [uuid, mac, extra] = token.split(".");
  if (extra || !uuid || !mac || !/^[a-f0-9-]{36}$/i.test(uuid)) return null;
  const expected = Buffer.from(signature(uuid, userId, secret));
  const received = Buffer.from(mac);
  return expected.length === received.length && timingSafeEqual(expected, received) ? uuid : null;
}
