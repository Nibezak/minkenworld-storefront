"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import Image from "next/image"
import { useCartContext } from "@/components/providers/Cart/context"

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
  const { addToCart: cartAddToCart, isAddingItem } = useCartContext()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm here to help you find exactly what you need. What are you looking for today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  
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
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || "I couldn't process that. Please try again.",
        products: data.products,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Agent error:", error)
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }])
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

  const handleAddToCart = async (product: any) => {
    setAddingProductId(product.id)
    try {
      await cartAddToCart({
        variantId: product.variant_id,
        quantity: 1,
        countryCode: 'ke'
      })
    } finally {
      setTimeout(() => setAddingProductId(null), 1000)
    }
  }

  // Product card component
  const ProductCard = ({ product, onAddToCart }: { product: any, onAddToCart: () => void }) => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200">
      <Link href={`/products/${product.handle}`} onClick={handleClose} className="block">
        <div className="flex gap-3 p-3">
          {product.thumbnail && (
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.title}</p>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {product.currency} {Number(product.price).toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
      {product.variant_id && (
        <div className="px-3 pb-3">
          <button
            onClick={(e) => {
              e.preventDefault()
              onAddToCart()
            }}
            disabled={addingProductId === product.id || isAddingItem}
            className="w-full py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50"
          >
            {addingProductId === product.id ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding...
              </span>
            ) : 'Add to Cart'}
          </button>
        </div>
      )}
    </div>
  )

  // Message bubble component
  const MessageBubble = ({ msg }: { msg: Message }) => (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${msg.role === "user" 
        ? "bg-gray-900 text-white" 
        : "bg-gray-50 text-gray-900"} rounded-2xl px-4 py-3`}
      >
        <div className="text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-sm font-semibold mb-1" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-sm font-semibold mb-1" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-sm font-medium mb-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-medium" {...props} />,
              p: ({node, ...props}) => <p className="mb-1.5 last:mb-0" {...props} />,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        
        {msg.products && msg.products.length > 0 && (
          <div className="mt-3 space-y-2">
            {msg.products.slice(0, 5).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Loading indicator
  const LoadingIndicator = () => (
    <div className="flex justify-start">
      <div className="bg-gray-50 rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
    </div>
  )

  // Mobile view
  if (isMobile) {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-900">Assistant</span>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 pb-20 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 text-gray-900 disabled:opacity-30 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setInternalIsOpen(true)}
        className="hidden lg:flex fixed bottom-6 right-6 z-50 w-12 h-12 bg-gray-900 hover:bg-gray-800 rounded-full shadow-lg items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    )
  }

  // Desktop chat window
  return (
    <div className="hidden lg:flex fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl flex-col overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-900">Assistant</span>
        </div>
        <button 
          onClick={handleClose} 
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-50">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-1.5 text-gray-900 disabled:opacity-30 transition-opacity hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
