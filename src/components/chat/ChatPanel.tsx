import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  processQuery,
  checkOllamaConnection,
  getAvailableModels,
} from '@/ai/chatService';
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  Bot,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const {
    chatMessages,
    addChatMessage,
    clearChat,
    toggleChat,
    projects,
    currentProjectId,
    projectStakeholders,
    workstreams,
  } = useStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [model, setModel] = useState('llama3.2');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Check Ollama connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkOllamaConnection();
      setIsConnected(connected);
      if (connected) {
        const models = await getAvailableModels();
        setAvailableModels(models);
        if (models.length > 0 && !models.includes(model)) {
          setModel(models[0]);
        }
      }
    };
    checkConnection();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const response = await processQuery(
        userMessage,
        {
          projectName: currentProject?.name || 'Unknown',
          stakeholderCount: projectStakeholders.length,
          workstreamCount: workstreams.length,
        },
        model
      );

      addChatMessage({
        role: 'assistant',
        content: response.content,
      });
    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestedQueries = [
    "Who is responsible for design?",
    "List all high-influence stakeholders",
    "Show champions in this project",
    "Who should I email weekly?",
  ];

  return (
    <div className="flex w-80 flex-col border-l bg-card">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Assistant</span>
          {isConnected === true && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              {model}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isConnected === false && (
            <Badge variant="destructive" className="text-[10px] py-0">
              Offline
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Connection Warning */}
      {isConnected === false && (
        <div className="flex items-start gap-2 border-b bg-destructive/10 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-destructive">Ollama not connected</p>
            <p className="text-muted-foreground">
              Make sure Ollama is running on localhost:11434
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          {chatMessages.length === 0 && (
            <div className="py-8 text-center">
              <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">
                Ask me about your stakeholders
              </p>
              <div className="space-y-2">
                {suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="block w-full rounded-md border bg-muted/50 px-3 py-2 text-left text-xs hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <MessageContent content={message.content} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about stakeholders..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  const lines = content.split('\n');
  
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold text
        const boldProcessed = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong>$1</strong>'
        );
        
        // Bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div
              key={i}
              className="pl-2"
              dangerouslySetInnerHTML={{ __html: boldProcessed }}
            />
          );
        }
        
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        
        return (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: boldProcessed }}
          />
        );
      })}
    </div>
  );
}

