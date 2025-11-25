import React, { createContext, useContext, useState, useCallback } from 'react';

const ConversationContext = createContext(null);

// Demo data to show what the interface looks like
const DEMO_MESSAGES = [
  {
    id: '1',
    role: 'user',
    content: 'Can you help me refactor the authentication module? It\'s getting too complex.',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    role: 'assistant',
    content: `I'll help you refactor the authentication module. Let me first analyze the current structure.`,
    timestamp: new Date(Date.now() - 3500000),
    toolCalls: [
      {
        id: 'tc1',
        name: 'Read',
        status: 'success',
        input: { file_path: '/src/auth/index.ts' },
        output: `export class AuthManager {
  private tokens: Map<string, Token> = new Map();
  private sessions: Session[] = [];

  async login(credentials: Credentials): Promise<AuthResult> {
    // Complex nested logic here...
  }
}`,
      },
      {
        id: 'tc2',
        name: 'Glob',
        status: 'success',
        input: { pattern: 'src/auth/**/*.ts' },
        output: 'Found 12 files in auth module',
      },
    ],
    blocks: [
      {
        id: 'b1',
        type: 'analysis',
        title: 'Codebase Analysis',
        content: `The authentication module has grown to include:
- 12 TypeScript files
- 3 different auth strategies (JWT, OAuth, Session)
- Mixed concerns between validation and business logic

**Recommended approach:**
1. Extract validation into separate middleware
2. Create strategy pattern for auth methods
3. Separate token management from session handling`,
        isCollapsed: true,
      },
    ],
  },
  {
    id: '3',
    role: 'user',
    content: 'That sounds good. Let\'s start with extracting the validation logic.',
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    id: '4',
    role: 'assistant',
    content: `I'll create a new validation middleware and refactor the existing code.`,
    timestamp: new Date(Date.now() - 2900000),
    toolCalls: [
      {
        id: 'tc3',
        name: 'Write',
        status: 'success',
        input: { file_path: '/src/auth/middleware/validation.ts' },
        output: 'File created successfully',
      },
      {
        id: 'tc4',
        name: 'Edit',
        status: 'success',
        input: { file_path: '/src/auth/index.ts', old_string: '...', new_string: '...' },
        output: 'File edited successfully',
      },
    ],
    blocks: [
      {
        id: 'b2',
        type: 'code',
        title: 'New Validation Middleware',
        language: 'typescript',
        content: `import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  next();
};`,
        isCollapsed: false,
      },
      {
        id: 'b3',
        type: 'diff',
        title: 'Changes to AuthManager',
        content: `- async login(credentials: Credentials): Promise<AuthResult> {
-   if (!this.validateCredentials(credentials)) {
-     throw new ValidationError('Invalid credentials');
-   }
+ async login(credentials: ValidatedCredentials): Promise<AuthResult> {
    // Business logic only now`,
        isCollapsed: true,
      },
    ],
  },
];

const DEMO_THREADS = [
  {
    id: 't1',
    type: 'question',
    title: 'Should we keep backward compatibility?',
    preview: 'The new validation middleware changes the API response format...',
    timestamp: new Date(Date.now() - 2800000),
    resolved: false,
  },
  {
    id: 't2',
    type: 'pending',
    title: 'Waiting: Database migration needed',
    preview: 'Need to add new columns for token metadata',
    timestamp: new Date(Date.now() - 2500000),
    resolved: false,
  },
  {
    id: 't3',
    type: 'error',
    title: 'Type error in session handler',
    preview: 'Property "expiresAt" is missing in type...',
    timestamp: new Date(Date.now() - 2000000),
    resolved: false,
  },
];

const DEMO_SESSIONS = [
  {
    id: 's1',
    title: 'Auth Module Refactor',
    preview: 'Refactoring authentication...',
    timestamp: new Date(Date.now() - 3600000),
    messageCount: 4,
    active: true,
  },
  {
    id: 's2',
    title: 'Bug: Login redirect loop',
    preview: 'Investigating the redirect issue...',
    timestamp: new Date(Date.now() - 86400000),
    messageCount: 12,
    active: false,
  },
  {
    id: 's3',
    title: 'Add dark mode support',
    preview: 'Implementing theme system...',
    timestamp: new Date(Date.now() - 172800000),
    messageCount: 8,
    active: false,
  },
];

export function ConversationProvider({ children }) {
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [threads, setThreads] = useState(DEMO_THREADS);
  const [sessions, setSessions] = useState(DEMO_SESSIONS);
  const [activeSession, setActiveSession] = useState('s1');
  const [isLoading, setIsLoading] = useState(false);

  const toggleBlockCollapse = useCallback((messageId, blockId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.blocks) return msg;
        return {
          ...msg,
          blocks: msg.blocks.map((block) =>
            block.id === blockId ? { ...block, isCollapsed: !block.isCollapsed } : block
          ),
        };
      })
    );
  }, []);

  const toggleToolCallCollapse = useCallback((messageId, toolCallId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.toolCalls) return msg;
        return {
          ...msg,
          toolCalls: msg.toolCalls.map((tc) =>
            tc.id === toolCallId ? { ...tc, isCollapsed: !tc.isCollapsed } : tc
          ),
        };
      })
    );
  }, []);

  const sendMessage = useCallback(async (content) => {
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'This is a demo response. In the real app, this would be Claude\'s response to your message.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const resolveThread = useCallback((threadId) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, resolved: true } : t))
    );
  }, []);

  const value = {
    messages,
    threads,
    sessions,
    activeSession,
    isLoading,
    setActiveSession,
    toggleBlockCollapse,
    toggleToolCallCollapse,
    sendMessage,
    resolveThread,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
}
