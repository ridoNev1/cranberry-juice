CREATE TABLE "ChatAttachment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "minioKey" TEXT NOT NULL,
    "openaiFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatAttachment_userId_idx" ON "ChatAttachment"("userId");
CREATE INDEX "ChatAttachment_agentId_idx" ON "ChatAttachment"("agentId");
CREATE INDEX "ChatAttachment_conversationId_idx" ON "ChatAttachment"("conversationId");
CREATE INDEX "ChatAttachment_messageId_idx" ON "ChatAttachment"("messageId");
CREATE INDEX "ChatAttachment_openaiFileId_idx" ON "ChatAttachment"("openaiFileId");

ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
