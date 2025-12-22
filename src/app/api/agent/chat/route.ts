import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages"
import { agent } from "@/lib/agent/graph"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Build conversation context from history
    const conversationMessages = history.map((msg: any) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content)
      } else if (msg.role === "assistant") {
        return new AIMessage(msg.content)
      }
      return null
    }).filter(Boolean)

    // Add current message
    conversationMessages.push(new HumanMessage(message))

    // Invoke the agent with full conversation context
    const result = await agent.invoke({
      messages: conversationMessages,
      products: [],
    })

    const lastMessage = result.messages[result.messages.length - 1]
    let content = ""
    let products: any[] = []

    if (lastMessage._getType() === "ai") {
      content = lastMessage.content as string

      // Extract products from tool responses
      const toolMessages = result.messages.filter((m: any) => m._getType() === "tool")
      toolMessages.forEach((toolMsg: any) => {
        try {
          const toolResult = JSON.parse(toolMsg.content)
          if (toolResult.products && Array.isArray(toolResult.products)) {
            products = products.concat(toolResult.products)
          }
        } catch (e) {
          // Ignore parse errors
        }
      })
    }

    return NextResponse.json({
      content,
      products: products.length > 0 ? products : undefined,
    })
  } catch (error) {
    console.error("Agent error:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: String(error) },
      { status: 500 }
    )
  }
}
