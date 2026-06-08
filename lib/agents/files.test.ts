import { describe, expect, it } from "vitest"

import {
  MAX_AGENT_FILE_SIZE_BYTES,
  buildAgentFileStorageKey,
  isVectorStoreSupportedAgentFile,
  validateAgentUploadFile,
} from "./files"

describe("agent file handling", () => {
  it("accepts PDF and image files up to 10 MB", () => {
    const pdf = validateAgentUploadFile({
      name: "research.pdf",
      type: "application/pdf",
      size: MAX_AGENT_FILE_SIZE_BYTES,
    })
    const image = validateAgentUploadFile({
      name: "diagram.png",
      type: "image/png",
      size: 2048,
    })

    expect(pdf.success).toBe(true)
    expect(image.success).toBe(true)
  })

  it("accepts PDF and image files by extension when the browser omits MIME type", () => {
    const result = validateAgentUploadFile({
      name: "notes.pdf",
      type: "",
      size: 1024,
    })

    expect(result.success).toBe(true)
  })

  it("rejects unsupported or oversized files", () => {
    const unsupported = validateAgentUploadFile({
      name: "notes.txt",
      type: "text/plain",
      size: 1024,
    })
    const oversized = validateAgentUploadFile({
      name: "large.pdf",
      type: "application/pdf",
      size: MAX_AGENT_FILE_SIZE_BYTES + 1,
    })

    expect(unsupported).toEqual({
      success: false,
      error: "Upload PDF or image files.",
    })
    expect(oversized).toEqual({
      success: false,
      error: "Files must be 10 MB or smaller.",
    })
  })

  it("builds stable storage keys with sanitized filenames", () => {
    const key = buildAgentFileStorageKey({
      userId: "user_123",
      agentId: "agent_456",
      fileId: "file_789",
      filename: "Project Notes (Final).pdf",
    })

    expect(key).toBe(
      "agents/user_123/agent_456/file_789-Project_Notes_Final.pdf"
    )
  })

  it("only sends PDF files to vector stores", () => {
    expect(
      isVectorStoreSupportedAgentFile({
        name: "research.pdf",
        type: "application/pdf",
      })
    ).toBe(true)
    expect(
      isVectorStoreSupportedAgentFile({
        name: "diagram.png",
        type: "image/png",
      })
    ).toBe(false)
  })
})
