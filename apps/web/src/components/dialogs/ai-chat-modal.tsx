'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Plus,
  Loader2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  isValidAIWorkflowResponse, 
  aiResponseToWorkflow,
  type AIResponse,
} from '@/lib/ai-workflow-converter';
import type { BlueprintNode, BlueprintEdge } from '@dapp-forge/blueprint-schema';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  aiResponse?: AIResponse;
}

interface AIChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyWorkflow?: (
    blueprintNodes: BlueprintNode[],
    blueprintEdges: BlueprintEdge[]
  ) => void;
}

export function AIChatModal({ open, onOpenChange, onApplyWorkflow }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! Describe the Web3 app you want to build and I'll suggest a component architecture for you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/blueprints/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_query: userQuery,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Check if it's a conversational message response
      if (data.type === 'message' && data.content) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
      // Check if it's a valid workflow response
      else if (isValidAIWorkflowResponse(data)) {
        const toolNames = data.tools.map((t) => t.name || t.type).join(', ');
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${data.description || 'Here\'s a suggested architecture:'}\n\nComponents: ${toolNames}`,
          timestamp: new Date(),
          aiResponse: data,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message || data.content || "I couldn't generate a workflow. Could you provide more details?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error calling AI workflow API:', error);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Something went wrong: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyWorkflow = (aiResponse: AIResponse) => {
    if (!aiResponse || !onApplyWorkflow) return;

    try {
      const { blueprintNodes } = aiResponseToWorkflow(aiResponse);
      
      // Create blueprint edges
      const blueprintEdges: BlueprintEdge[] = [];
      const toolIdToNodeId = new Map<string, string>();
      
      aiResponse.tools.forEach((tool, index) => {
        if (blueprintNodes[index]) {
          toolIdToNodeId.set(tool.id, blueprintNodes[index].id);
        }
      });
      
      aiResponse.tools.forEach((tool) => {
        const sourceNodeId = toolIdToNodeId.get(tool.id);
        if (!sourceNodeId) return;
        
        tool.next_tools.forEach((nextToolId) => {
          const targetNodeId = toolIdToNodeId.get(nextToolId);
          if (targetNodeId) {
            blueprintEdges.push({
              id: crypto.randomUUID(),
              source: sourceNodeId,
              target: targetNodeId,
              type: 'dependency',
            });
          }
        });
      });
      
      onApplyWorkflow(blueprintNodes, blueprintEdges);
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error applying workflow:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const examplePrompts = [
    "NFT marketplace",
    "DeFi dashboard",
    "Trading bot",
    "Telegram alerts",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[70vh] max-h-[600px] max-w-xl flex-col p-0 gap-0 border-forge-border bg-forge-surface overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-forge-border/50 px-5 py-3.5 bg-forge-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forge-elevated flex items-center justify-center">
              <Bot className="w-4 h-4 text-accent-cyan" />
            </div>
            <div>
              <DialogTitle className="text-white text-sm font-medium">AI Assistant</DialogTitle>
              <DialogDescription className="text-forge-muted text-xs">
                Describe your app to generate a blueprint
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'flex gap-2.5',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-forge-elevated">
                    <Bot className="h-3.5 w-3.5 text-accent-cyan" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-3.5 py-2.5',
                    message.role === 'user'
                      ? 'bg-accent-cyan text-black'
                      : 'bg-forge-elevated text-forge-text'
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                  {message.aiResponse && (
                    <div className="mt-3 pt-2.5 border-t border-forge-border/30">
                      <Button
                        onClick={() => handleApplyWorkflow(message.aiResponse!)}
                        size="sm"
                        className="w-full h-8 bg-accent-cyan hover:bg-accent-cyan/90 text-black text-xs font-medium"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add to Canvas
                      </Button>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-forge-elevated">
                    <User className="h-3.5 w-3.5 text-forge-muted" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              className="flex gap-2.5 justify-start"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-forge-elevated">
                <Bot className="h-3.5 w-3.5 text-accent-cyan" />
              </div>
              <div className="bg-forge-elevated rounded-xl px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-accent-cyan animate-spin" />
                  <span className="text-sm text-forge-muted">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example prompts */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-5 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs px-2.5 py-1 rounded-md bg-forge-elevated/60 text-forge-muted hover:text-white hover:bg-forge-elevated transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-forge-border/50 p-4 bg-forge-bg/50">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your app..."
                className="w-full min-h-[44px] max-h-[100px] px-3 py-2.5 text-sm bg-forge-elevated border border-forge-border/50 rounded-lg text-white placeholder:text-forge-muted focus:outline-none focus:border-accent-cyan/40 transition-colors resize-none"
                disabled={isLoading}
                rows={1}
              />
              {input && (
                <button
                  onClick={() => setInput('')}
                  className="absolute right-2.5 top-2.5 text-forge-muted hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="h-[44px] w-[44px] p-0 bg-accent-cyan hover:bg-accent-cyan/90 text-black disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-forge-muted text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
