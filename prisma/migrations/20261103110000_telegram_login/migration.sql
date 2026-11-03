BEGIN;
ALTER TABLE "AdminSession" ADD COLUMN "authProvider" VARCHAR(16) NOT NULL DEFAULT 'PASSWORD';
ALTER TABLE "AdminSession" DROP CONSTRAINT "AdminSession_valid_check";
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_valid_check" CHECK (
  (("authProvider" = 'PASSWORD' AND "credentialVersion" > 0) OR ("authProvider" = 'TELEGRAM' AND "credentialVersion" = 0))
  AND "expiresAt" > "createdAt" AND "tokenHash" ~ '^[a-f0-9]{64}$');
CREATE TABLE "TelegramLoginAttempt" (
  "stateHash" CHAR(64) PRIMARY KEY,
  "browserHash" CHAR(64) NOT NULL,
  verifier VARCHAR(64) NOT NULL,
  nonce VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelegramLoginAttempt_expiry_check" CHECK ("expiresAt" > "createdAt")
);
CREATE INDEX "TelegramLoginAttempt_expiresAt_idx" ON "TelegramLoginAttempt"("expiresAt");
ALTER TABLE "TelegramLoginAttempt" ENABLE ROW LEVEL SECURITY;
COMMIT;
