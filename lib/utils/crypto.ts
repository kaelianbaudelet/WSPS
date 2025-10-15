
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

function getKeyFromEnv(): Buffer {
    const b64 = process.env.ENCRYPTION_KEY_BASE64;
    if (!b64) throw new Error("Missing ENCRYPTION_KEY_BASE64 env var");
    const key = Buffer.from(b64, "base64");
    if (key.length !== KEY_LEN) throw new Error("ENCRYPTION_KEY_BASE64 must decode to 32 bytes");
    return key;
}

export function encryptText(plain: string, key?: Buffer) {
    const k = key ?? getKeyFromEnv();
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALGO, k, iv, { authTagLength: TAG_LEN });
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(plain, "utf8")), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
        data: ciphertext.toString("base64"),
    };
}

export function decryptText(payload: { iv: string; tag: string; data: string }, key?: Buffer) {
    const k = key ?? getKeyFromEnv();
    const iv = Buffer.from(payload.iv, "base64");
    const tag = Buffer.from(payload.tag, "base64");
    const data = Buffer.from(payload.data, "base64");

    const decipher = crypto.createDecipheriv(ALGO, k, iv, { authTagLength: TAG_LEN });
    decipher.setAuthTag(tag);
    const plainBuf = Buffer.concat([decipher.update(data), decipher.final()]);
    const plain = plainBuf.toString("utf8");
    plainBuf.fill(0);
    return plain;
}

export function encryptObject(obj: any, key?: Buffer) {
    return encryptText(JSON.stringify(obj), key);
}
export function decryptToObject<T = any>(payload: { iv: string; tag: string; data: string }, key?: Buffer): T {
    const plain = decryptText(payload, key);
    return JSON.parse(plain) as T;
}