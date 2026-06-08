import { describe, expect, it } from "vitest"

import {
  buildChatRoomRenderKey,
  buildConversationHref,
  groupConversationsByDate,
} from "./sidebar"

describe("buildConversationHref", () => {
  it("uses the global chat route for default-agent conversations", () => {
    expect(
      buildConversationHref({
        id: "conversation_123",
        agentId: "agent_default",
        isDefaultAgent: true,
      })
    ).toBe("/chat?conversation=conversation_123")
  })

  it("uses the agent chat route for agent conversations", () => {
    expect(
      buildConversationHref({
        id: "conversation_123",
        agentId: "agent_custom",
        isDefaultAgent: false,
      })
    ).toBe("/chat/agent_custom?conversation=conversation_123")
  })
})

describe("buildChatRoomRenderKey", () => {
  it("uses different keys for a new chat and an existing conversation", () => {
    expect(buildChatRoomRenderKey("agent_123", null)).toBe("agent_123:new")
    expect(buildChatRoomRenderKey("agent_123", "conversation_456")).toBe(
      "agent_123:conversation_456"
    )
  })
})

describe("groupConversationsByDate", () => {
  it("groups conversations by relative day", () => {
    const groups = groupConversationsByDate(
      [
        {
          id: "today",
          updatedAt: new Date("2026-06-09T04:00:00.000Z"),
        },
        {
          id: "yesterday",
          updatedAt: new Date("2026-06-08T04:00:00.000Z"),
        },
        {
          id: "earlier",
          updatedAt: new Date("2026-06-01T04:00:00.000Z"),
        },
      ],
      new Date("2026-06-09T12:00:00.000Z")
    )

    expect(groups).toEqual([
      {
        label: "Today",
        conversations: [
          {
            id: "today",
            updatedAt: new Date("2026-06-09T04:00:00.000Z"),
          },
        ],
      },
      {
        label: "Yesterday",
        conversations: [
          {
            id: "yesterday",
            updatedAt: new Date("2026-06-08T04:00:00.000Z"),
          },
        ],
      },
      {
        label: "Earlier",
        conversations: [
          {
            id: "earlier",
            updatedAt: new Date("2026-06-01T04:00:00.000Z"),
          },
        ],
      },
    ])
  })

  it("omits empty groups", () => {
    const groups = groupConversationsByDate(
      [
        {
          id: "earlier",
          updatedAt: new Date("2026-05-30T04:00:00.000Z"),
        },
      ],
      new Date("2026-06-09T12:00:00.000Z")
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBe("Earlier")
  })
})
