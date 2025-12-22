import { Annotation } from "@langchain/langgraph"
import { BaseMessage } from "@langchain/core/messages"

// Define the state that the agent will use
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  products: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
})

export type AgentStateType = typeof AgentState.State
