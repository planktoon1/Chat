import crypto from "crypto";

export function createId() {
  return crypto.randomBytes(4).toString("hex");
}
