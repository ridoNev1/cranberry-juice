import { describe, expect, it } from "vitest"

import { parseAgentCreateInput, parseAgentUpdateInput } from "./validation"

describe("agent validation", () => {
  it("normalizes create input and applies the default model", () => {
    const result = parseAgentCreateInput({
      name: "  Research Helper  ",
      description: "  Summarizes uploaded papers.  ",
      systemPrompt: "  Be precise.  ",
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(result.error)
    }
    expect(result.data).toEqual({
      name: "Research Helper",
      description: "Summarizes uploaded papers.",
      model: "gpt-4o-mini",
      systemPrompt: "Be precise.",
    })
  })

  it("rejects an empty agent name", () => {
    const result = parseAgentCreateInput({ name: "   " })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error("Expected validation to fail.")
    }
    expect(result.error).toBe("Agent name is required.")
  })

  it("accepts reasoning models", () => {
    const createResult = parseAgentCreateInput({
      name: "Planning Agent",
      model: "gpt-5.4-mini",
    })
    const updateResult = parseAgentUpdateInput({ model: "gpt-5-mini" })

    expect(createResult.success).toBe(true)
    expect(updateResult.success).toBe(true)
  })

  it("rejects unsupported models on update", () => {
    const result = parseAgentUpdateInput({ model: "unknown-model" })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error("Expected validation to fail.")
    }
    expect(result.error).toBe("Choose a supported model.")
  })
})
