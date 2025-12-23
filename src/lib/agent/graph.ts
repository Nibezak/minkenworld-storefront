import { ChatOpenAI } from "@langchain/openai"
import { StateGraph } from "@langchain/langgraph"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { AgentState } from "./state"
import { tools } from "./tools"

// Initialize OpenAI model with tools
const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
}).bindTools(tools)

// System prompt for the shopping assistant
const systemPrompt = `You are a helpful shopping assistant for MinkenWorld, a marketplace for houses, cars, electronics, and more.

Your role is to help users find products. When you search and find products:

IMPORTANT RULES:
- DO NOT describe or list individual products with their prices, images, or details
- DO NOT repeat product information - the UI will automatically show product cards
- Just acknowledge you found products with a brief response like "Here's what I found!" or "I found some options for you"
- Keep responses SHORT and conversational (1-2 sentences max)

Good response examples:
- "Here are some houses I found for you!"
- "I found a few options - take a look!"
- "Here's what's available right now."

Bad response examples (DON'T do this):
- "I found House in Lavington for KES 18,000,000..." (too detailed)
- Listing out each product with price and description (redundant)

When no products are found, briefly suggest alternatives.
When users ask questions (not searching), be helpful and conversational.`

// Define the agent node
async function callModel(state: typeof AgentState.State) {
  const messages = [
    new SystemMessage(systemPrompt),
    ...state.messages,
  ]

  const response = await model.invoke(messages)
  return { messages: [response] }
}

// Function to determine if we should continue or end
function shouldContinue(state: typeof AgentState.State) {
  const lastMessage = state.messages[state.messages.length - 1]
  
  // If there are tool calls, continue to tool node
  if (lastMessage._getType() === "ai" && (lastMessage as AIMessage).tool_calls?.length) {
    return "tools"
  }
  
  // Otherwise, end
  return "__end__"
}

// Build the graph
const workflow = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", new ToolNode(tools))
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    __end__: "__end__",
  })
  .addEdge("tools", "agent")

// Compile the graph
export const agent = workflow.compile()
