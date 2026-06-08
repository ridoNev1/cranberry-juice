-- Add OpenAI vector store linkage for agent retrieval.
ALTER TABLE "Agent" ADD COLUMN "vectorStoreId" TEXT;

ALTER TABLE "AgentFile" ADD COLUMN "openaiVectorStoreFileId" TEXT;
ALTER TABLE "AgentFile" ADD COLUMN "vectorStoreStatus" TEXT;

CREATE UNIQUE INDEX "Agent_vectorStoreId_key" ON "Agent"("vectorStoreId");
CREATE INDEX "AgentFile_openaiVectorStoreFileId_idx" ON "AgentFile"("openaiVectorStoreFileId");
