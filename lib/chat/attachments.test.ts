import { describe, expect, it } from "vitest"

import { buildChatAttachmentStorageKey } from "./attachments"

describe("buildChatAttachmentStorageKey", () => {
  it("builds stable storage keys with sanitized filenames", () => {
    expect(
      buildChatAttachmentStorageKey({
        userId: "user_123",
        attachmentId: "attachment_456",
        filename: "Research Notes (Final).pdf",
      })
    ).toBe("chat/user_123/attachment_456-Research_Notes_Final.pdf")
  })
})
