ALTER TABLE "Agent" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Agent_userId_isDefault_idx" ON "Agent"("userId", "isDefault");
