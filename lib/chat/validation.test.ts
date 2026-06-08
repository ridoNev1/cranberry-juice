import { describe, expect, it } from "vitest"

import {
  buildConversationTitle,
  parseChatRequestInput,
  parseConversationCreateInput,
} from "./validation"

describe("chat validation", () => {
  it("normalizes chat requests", () => {
    const result = parseChatRequestInput({
      agentId: "agent_123",
      conversationId: "conv_123",
      message: "  Explain this file.  ",
    })

    expect(result).toEqual({
      success: true,
      data: {
        agentId: "agent_123",
        attachmentIds: [],
        conversationId: "conv_123",
        message: "Explain this file.",
      },
    })
  })

  it("allows global chat requests without an agent id", () => {
    const result = parseChatRequestInput({
      message: "  Start a regular chat.  ",
      attachmentIds: ["attachment_1"],
    })

    expect(result).toEqual({
      success: true,
      data: {
        agentId: null,
        attachmentIds: ["attachment_1"],
        conversationId: null,
        message: "Start a regular chat.",
      },
    })
  })

  it("rejects empty chat messages", () => {
    const result = parseChatRequestInput({
      agentId: "agent_123",
      message: "   ",
    })

    expect(result).toEqual({
      success: false,
      error: "Message is required.",
    })
  })

  it("normalizes optional conversation titles", () => {
    const result = parseConversationCreateInput({
      title: "  Research notes  ",
    })

    expect(result).toEqual({
      success: true,
      data: { title: "Research notes" },
    })
  })

  it("builds compact titles from the first user message", () => {
    expect(
      buildConversationTitle(
        "Summarize this document and identify the most important implementation risks for the team."
      )
    ).toBe("Summarize this document and identify the most important...")
  })
})
