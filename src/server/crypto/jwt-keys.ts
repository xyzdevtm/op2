import * as jose from "jose";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const KEYS_DIR = path.join(
  process.cwd(),
  "data",
  "keys",
);

let privateKey: jose.KeyLike | null = null;
let publicKey: jose.KeyLike | null = null;
let jwks: jose.JSONWebKeySet | null = null;

async function ensureKeysDir() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }
}

async function generateKeyPair() {
  await ensureKeysDir();

  const { privateKey: priv, publicKey: pub } =
    await jose.generateKeyPair("EdDSA", { crv: "Ed25519", extractable: true });

  // Export to PEM, then re-import for consistent KeyLike types
  const privPem = await jose.exportPKCS8(priv);
  fs.writeFileSync(path.join(KEYS_DIR, "private.pem"), privPem);

  const pubPem = await jose.exportSPKI(pub);
  fs.writeFileSync(path.join(KEYS_DIR, "public.pem"), pubPem);

  const jwk = await jose.exportJWK(pub);
  const jwkWithKid = { ...jwk, kid: "main-key", alg: "EdDSA", use: "sig" };
  fs.writeFileSync(
    path.join(KEYS_DIR, "public.jwk.json"),
    JSON.stringify(jwkWithKid, null, 2),
  );

  // Re-import from PEM for consistent KeyLike objects
  const importedPriv = await jose.importPKCS8(privPem, "EdDSA");
  const importedPub = await jose.importSPKI(pubPem, "EdDSA");

  return { priv: importedPriv, pub: importedPub, jwk: jwkWithKid };
}

async function loadOrGenerateKeys(): Promise<{
  priv: jose.KeyLike;
  pub: jose.KeyLike;
  jwk: jose.JWK;
}> {
  const privPath = path.join(KEYS_DIR, "private.pem");
  const pubPath = path.join(KEYS_DIR, "public.pem");
  const jwkPath = path.join(KEYS_DIR, "public.jwk.json");

  if (
    fs.existsSync(privPath) &&
    fs.existsSync(pubPath) &&
    fs.existsSync(jwkPath)
  ) {
    const privPem = fs.readFileSync(privPath, "utf-8");
    const pubPem = fs.readFileSync(pubPath, "utf-8");
    const jwk = JSON.parse(
      fs.readFileSync(jwkPath, "utf-8"),
    ) as jose.JWK;

    const priv = await jose.importPKCS8(privPem, "EdDSA");
    const pub = await jose.importSPKI(pubPem, "EdDSA");

    return { priv, pub, jwk };
  }

  return generateKeyPair();
}

export async function getPrivateKey(): Promise<jose.KeyLike> {
  if (!privateKey) {
    const keys = await loadOrGenerateKeys();
    privateKey = keys.priv;
  }
  return privateKey;
}

export async function getPublicKey(): Promise<jose.KeyLike> {
  if (!publicKey) {
    const keys = await loadOrGenerateKeys();
    publicKey = keys.pub;
  }
  return publicKey;
}

export async function getJWKS(): Promise<jose.JSONWebKeySet> {
  if (!jwks) {
    const keys = await loadOrGenerateKeys();
    jwks = { keys: [keys.jwk as jose.JWK] };
  }
  return jwks;
}

export async function signToken(
  payload: Record<string, unknown>,
  expiresIn = "15m",
): Promise<string> {
  const key = await getPrivateKey();
  const jwk = await getJWKS();
  const kid = jwk.keys[0]?.kid || "main-key";

  return new jose.SignJWT({ ...payload, jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: "EdDSA", kid })
    .setIssuedAt()
    .setIssuer(getIssuer())
    .setAudience(getAudience())
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyToken(
  token: string,
): Promise<jose.JWTPayload> {
  const key = await getPublicKey();
  const { payload } = await jose.jwtVerify(token, key, {
    algorithms: ["EdDSA"],
    issuer: getIssuer(),
    audience: getAudience(),
  });
  return payload;
}

export function getIssuer(): string {
  const domain = process.env.DOMAIN || "localhost";
  if (domain === "localhost") {
    return "http://localhost:3000";
  }
  return `https://${domain}`;
}

export function getAudience(): string {
  return process.env.DOMAIN || "localhost";
}
