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
const systemPrompt = `You are a helpful MinkenWorld AI for MinkenWorld, a marketplace where users can buy and sell anything - from houses and cars to electronics and everyday items.

Your role is to:
1. Have natural conversations and remember context from earlier in the conversation
2. Understand what the user is looking for based on their messages
3. Search the marketplace using the available tools  
4. Recommend MULTIPLE products that match their needs (show all relevant options, not just 1-2)
5. Compare prices and highlight good deals
6. Answer questions about products, pricing, and availability
7. Help users narrow down choices by comparing features and prices

Be friendly, conversational, and helpful. When recommending products:
- Show MULTIPLE options (3-10 products) so users can compare
- Highlight key details like price and unique features
- Compare prices between products when showing multiple items  
- Suggest alternatives at different price points
- Remember what they asked for earlier in the conversation

When users ask for products:
- Use search_products tool to find items (set limit to 10 to show more options)
- Use list_all_products when they say "show me everything" or "what do you have"
- Use get_categories when they want to browse categories

Always format prices clearly in Kenyan Shillings (KES) with thousand separators.

IMPORTANT: Show multiple product options when available so users can compare and choose!`

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
