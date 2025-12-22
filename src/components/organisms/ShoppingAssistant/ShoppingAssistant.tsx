"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import Image from "next/image"

interface Message {
  role: "user" | "assistant"
  content: string
  products?: any[]
}

interface ShoppingAssistantProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

export const ShoppingAssistant = ({ isOpen: externalIsOpen, onClose, isMobile = false }: ShoppingAssistantProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your MinkenWorld AI. How can I help you find what you need today?",
    },
  ])
 const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isOpen = isMobile ? (externalIsOpen ?? false) : internalIsOpen

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    const currentInput = input
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Send full conversation history for context
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentInput,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from agent")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || "I'm sorry, I couldn't process that request.",
        products: data.products,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Agent error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClose = () => {
    if (isMobile && onClose) {
      onClose()
    } else {
      setInternalIsOpen(false)
    }
  }

  // Mobile view - full screen modal
  if (isMobile) {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold">MinkenWorld AI</h3>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ height: "calc(100vh - 140px)" }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-action text-white" : "bg-gray-100"} rounded-lg p-3`}>
                <div className="text-sm prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-base font-bold mb-1" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-sm font-bold mb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs font-semibold text-gray-700">Recommended Products ({msg.products.length}):</p>
                    {msg.products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white p-3 rounded-lg border hover:border-action transition-colors"
                      >
                        <Link href={`/products/${product.handle}`} onClick={handleClose} className="block">
                          <div className="flex gap-3">
                            {product.thumbnail && (
                              <div className="relative w-20 h-20 flex-shrink-0">
                                <Image
                                  src={product.thumbnail}
                                  alt={product.title}
                                  fill
                                  className="object-cover rounded"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.title}</p>
                              <p className="text-xs font-semibold text-action">
                                {product.currency} {Number(product.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                        {product.variant_id && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              // Add to cart logic
                              const cartData = {
                                variant_id: product.variant_id,
                                quantity: 1
                              }
                              fetch('/api/cart/line-items', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(cartData)
                              }).then(() => {
                                alert('Added to cart!')
                              }).catch(err => console.error('Cart error:', err))
                            }}
                            className="mt-2 w-full py-1.5 px-3 bg-action text-white text-xs font-medium rounded hover:bg-action-hover transition-colors"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-action text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-action text-white rounded-lg hover:bg-action-hover disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop view
  if (!isOpen) {
    return (
      <button
        onClick={() => setInternalIsOpen(true)}
        className="hidden lg:flex fixed bottom-4 right-4 z-50 w-14 h-14 bg-action hover:bg-action-hover rounded-full shadow-lg items-center justify-center md:bottom-8 md:right-8"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="hidden lg:flex fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex-col md:bottom-8 md:right-8">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold">MinkenWorld AI</h3>
        </div>
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${msg.role === "user" ? "bg-action text-white" : "bg-gray-100"} rounded-lg p-3`}>
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-base font-bold mb-1" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-sm font-bold mb-1" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              
              {msg.products && msg.products.length > 0 && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-700">Recommended Products ({msg.products.length}):</p>
                  {msg.products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white p-3 rounded-lg border hover:border-action transition-colors"
                    >
                      <Link href={`/products/${product.handle}`} className="block">
                        <div className="flex gap-3">
                          {product.thumbnail && (
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <Image
                                src={product.thumbnail}
                                alt={product.title}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.title}</p>
                            <p className="text-xs font-semibold text-action">
                              {product.currency} {Number(product.price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                      {product.variant_id && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            const cartData = {
                              variant_id: product.variant_id,
                              quantity: 1
                            }
                            fetch('/api/cart/line-items', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(cartData)
                            }).then(() => {
                              alert('Added to cart!')
                            }).catch(err => console.error('Cart error:', err))
                          }}
                          className="mt-2 w-full py-1.5 px-3 bg-action text-white text-xs font-medium rounded hover:bg-action-hover transition-colors"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-action text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-action text-white rounded-lg hover:bg-action-hover disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
