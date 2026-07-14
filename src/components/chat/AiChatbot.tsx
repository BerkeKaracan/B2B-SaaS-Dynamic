'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useCanvasStore } from '@/store/useCanvasStore';
import { fetchAPI } from '@/services/api';
import { Send, Loader2, Database, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiChatActionPayload {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  createdBy?: string;
  updatedBy?: string;
  text?: string;
  content?: string;
  mode?: string;
  x?: number;
  y?: number;
  parentId?: string | null;
  module_id?: string;
  project_id?: string;
  page_id?: string;
  board_id?: string;
  [key: string]: unknown;
}

interface AiChatResponse {
  message?: string;
  reply?: string;
  tool_executed?: boolean;
  action?: string | null;
  action_type?: string | null;
  payload?: AiChatActionPayload | null;
  actions?: Array<{
    action?: string;
    action_type?: string;
    payload?: AiChatActionPayload;
  }>;
  errors?: string[];
  current_module?: string;
  module_id?: string;
  page_id?: string;
}

function normalizePageModule(type?: string | null): string | null {
  if (!type || type === 'empty') return null;
  if (type === 'notes' || type === 'note') return 'notepad';
  if (type === 'doc') return 'document';
  return type;
}

export default function AiChatbot() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const projectId = params?.projectId as string | undefined;

  const pages = useCanvasStore((s) => s.pages);
  const metadata = useCanvasStore((s) => s.metadata);
  const recordId = useCanvasStore((s) => s.recordId);
  const activePageId = useCanvasStore((s) => s.activePageId);
  const appendKanbanTask = useCanvasStore((s) => s.appendKanbanTask);
  const appendMindmapNode = useCanvasStore((s) => s.appendMindmapNode);
  const applyNotepadUpdate = useCanvasStore((s) => s.applyNotepadUpdate);
  const appendWhiteboardNote = useCanvasStore((s) => s.appendWhiteboardNote);
  const saveProject = useCanvasStore((s) => s.saveProject);

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) || pages[0],
    [pages, activePageId]
  );

  const currentModule = useMemo(() => {
    const template = String(metadata?.template || '').toLowerCase();
    const pageModule = normalizePageModule(activePage?.type);

    // Dedicated template projects (kanban/mindmap/…) win when there is no typed frame.
    if (
      template &&
      !['blank', 'empty', 'canvas', 'general'].includes(template) &&
      !pageModule
    ) {
      return template === 'notes' ? 'notepad' : template;
    }

    // Infinite canvas / blank project: follow the active frame.
    if (pageModule) return pageModule;

    if (template) return template === 'notes' ? 'notepad' : template;
    return 'general';
  }, [metadata?.template, activePage]);

  // custom_records id for backend tools (never a canvas page/frame id)
  const moduleId = recordId || projectId || undefined;

  // Active frame id for page-scoped templates on the infinite canvas
  const pageId = useMemo(() => {
    if (activePage?.type && activePage.type !== 'empty') return activePage.id;
    const typeMap: Record<string, string[]> = {
      kanban: ['kanban'],
      mindmap: ['mindmap'],
      notepad: ['notes', 'document'],
      document: ['document', 'notes'],
      whiteboard: ['whiteboard'],
    };
    const wanted = typeMap[currentModule] || [];
    return pages.find((p) => wanted.includes(p.type))?.id;
  }, [activePage, currentModule, pages]);

  const boardId = currentModule === 'kanban' ? pageId : undefined;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I adapt to your active module — try creating a Kanban task, mindmap node, or note update.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [hasProjectAccess, setHasProjectAccess] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [projectContext, setProjectContext] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildCanvasContext = () => {
    let context = `--- ACTIVE MODULE: ${currentModule} ---\n`;
    if (moduleId) context += `Module / project ID: ${moduleId}\n`;
    if (pageId) context += `Active page / frame ID: ${pageId}\n`;
    if (boardId) context += `Kanban board frame ID: ${boardId}\n`;
    context += `Project template: ${String(metadata?.template || 'blank')}\n`;

    if (currentModule === 'kanban') {
      const tasks =
        (metadata.tasks as Array<Record<string, unknown>>) ||
        (metadata.kanbanTasks as Array<Record<string, unknown>>) ||
        [];
      context += `Existing tasks (${tasks.length}):\n`;
      if (tasks.length === 0) {
        context += '- (none yet)\n';
      } else {
        tasks.slice(0, 40).forEach((t) => {
          context += `- [${t.status || 'TO DO'}] ${t.title} (priority: ${t.priority || 'NO PRIORITY'})\n`;
        });
      }
      return context.substring(0, 3500);
    }

    if (currentModule === 'mindmap') {
      const nodes =
        (metadata.mindmapNodes as Array<Record<string, unknown>>) || [];
      context += `Mindmap nodes (${nodes.length}):\n`;
      nodes.slice(0, 40).forEach((n) => {
        context += `- ${n.text}${n.parentId ? ` (child of ${n.parentId})` : ' (root)'}\n`;
      });
      return context.substring(0, 3500);
    }

    if (currentModule === 'notepad' || currentModule === 'document') {
      const settings = (activePage?.settings || {}) as Record<string, unknown>;
      const note =
        settings.notepadContent ||
        settings.documentContent ||
        metadata.notepadContent ||
        '';
      context += `Current note title: ${settings.notepadTitle || metadata.notepadTitle || activePage?.title || 'Untitled'}\n`;
      context += `Current note content:\n${String(note).slice(0, 2500)}\n`;
      return context.substring(0, 3500);
    }

    if (currentModule === 'whiteboard') {
      const settings = (activePage?.settings || {}) as Record<string, unknown>;
      const texts =
        (settings.whiteboardTexts as Array<Record<string, unknown>>) ||
        (metadata.whiteboardTexts as Array<Record<string, unknown>>) ||
        [];
      context += `Whiteboard notes (${texts.length}):\n`;
      texts.slice(0, 30).forEach((t) => {
        context += `- ${t.content || t.text || ''}\n`;
      });
      return context.substring(0, 3500);
    }

    if (!pages || pages.length === 0) {
      return context + 'The active canvas is completely empty.';
    }

    context += '--- ACTIVE CANVAS BLOCKS ---\n';
    pages.forEach((page, i) => {
      context += `[Page/Frame ${i + 1}: ${page.title} | type=${page.type}]\n`;
      page.blocks.forEach((block) => {
        if (
          block.type === 'text' &&
          typeof block.value === 'string' &&
          block.value.trim() !== ''
        ) {
          context += `- ${block.value}\n`;
        } else if (block.type === 'checkbox') {
          context += `- Checkbox (Status: ${block.value ? 'Checked' : 'Unchecked'})\n`;
        }
      });
      context += '\n';
    });
    return context.substring(0, 3000);
  };

  const applyAgentActions = async (data: AiChatResponse) => {
    if (data.errors && data.errors.length > 0) {
      toast.error(data.errors[0]);
    }

    const actionItems =
      data.actions && data.actions.length > 0
        ? data.actions
        : data.tool_executed && (data.action || data.action_type) && data.payload
          ? [
              {
                action: data.action || data.action_type || undefined,
                action_type: data.action_type || data.action || undefined,
                payload: data.payload,
              },
            ]
          : [];

    let shouldPersist = false;
    const targetPageId =
      data.page_id || pageId || boardId || activePageId || undefined;

    for (const item of actionItems) {
      const action = item.action || item.action_type;
      const payload = item.payload;
      if (!action || !payload) continue;

      if (action === 'TASK_ADDED' || action === 'TASK_CREATED') {
        const newTaskData = {
          id: payload.id || payload.db_id,
          db_id: payload.db_id || payload.id,
          title: payload.title,
          description: payload.description || '',
          status: payload.status || 'TO DO',
          priority: payload.priority || 'MEDIUM',
          assignee: payload.assignee || 'Unassigned',
          createdBy: payload.createdBy || 'AI Assistant',
          updatedBy: payload.updatedBy || 'AI Assistant',
          module_id: payload.module_id || moduleId,
          project_id: payload.project_id || moduleId || projectId,
          board_id: payload.board_id || boardId || targetPageId,
          page_id: payload.page_id || boardId || targetPageId,
        };

        appendKanbanTask(newTaskData);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('onAiTaskCreated', { detail: newTaskData })
          );
        }

        toast.success(`Task added: ${payload.title || 'Untitled'}`);
        shouldPersist = true;
      } else if (action === 'TASK_MOVED') {
        const existing =
          ((metadata.tasks || metadata.kanbanTasks) as Array<
            Record<string, unknown>
          >) || [];
        const next = existing.map((t) =>
          t.id === payload.id ||
          String(t.title || '').toLowerCase() ===
            String(payload.title || '').toLowerCase()
            ? { ...t, ...payload }
            : t
        );
        useCanvasStore.getState().updateMetadata({
          tasks: next,
          kanbanTasks: next,
        });
        toast.success(`Moved: ${payload.title || 'task'}`);
        shouldPersist = true;
      } else if (action === 'MINDMAP_NODE_ADDED') {
        const nodeData = {
          id: payload.id,
          text: payload.text,
          x: payload.x ?? 400,
          y: payload.y ?? 300,
          parentId: payload.parentId ?? null,
          color: 'bg-indigo-600',
          page_id: payload.page_id || targetPageId,
        };
        appendMindmapNode(nodeData);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('onAiMindmapNodeCreated', { detail: nodeData })
          );
        }
        toast.success(`Mindmap node added: ${payload.text || ''}`);
        shouldPersist = true;
      } else if (action === 'NOTEPAD_UPDATED') {
        applyNotepadUpdate({
          content: payload.content,
          title: payload.title,
          mode: payload.mode,
          moduleId: payload.page_id || targetPageId || moduleId,
        });
        toast.success('Notepad updated');
        shouldPersist = true;
      } else if (action === 'WHITEBOARD_NOTE_ADDED') {
        const noteText = payload.content || payload.text || '';
        appendWhiteboardNote(
          {
            id: payload.id,
            text: noteText,
            content: noteText,
            x: payload.x ?? 140,
            y: payload.y ?? 120,
            color: '#fef3c7',
            font: 'sans-serif',
            size: 18,
          },
          payload.page_id || targetPageId || moduleId
        );
        toast.success('Whiteboard note added');
        shouldPersist = true;
      }
    }

    if (shouldPersist && tenantId && (projectId || recordId)) {
      try {
        await saveProject(tenantId);
      } catch (err) {
        console.error('Failed to persist AI action:', err);
      }
    }
  };

  const handleGrantAccess = async () => {
    if (!tenantId) return;
    setIsLoadingAccess(true);

    try {
      const res = await fetchAPI(`/api/records?tenant_id=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (!Array.isArray(data)) {
          setIsLoadingAccess(false);
          return;
        }

        type ProjectItem = {
          module_name: string;
          record_data?: {
            name?: string;
            description?: string;
            isPrivate?: boolean;
            visibility?: string;
            template?: string;
          };
        };

        const publicProjects = data.filter((item: ProjectItem) => {
          const isConfig = item.module_name === 'workspace_modules';
          const isPrivate =
            item.record_data?.isPrivate === true ||
            item.record_data?.visibility === 'private';
          return !isConfig && !isPrivate;
        });

        let pContext = '--- WORKSPACE PUBLIC PROJECTS ---\n';
        if (publicProjects.length === 0) {
          pContext += 'No public projects found in this workspace.\n';
        } else {
          publicProjects.forEach((p: ProjectItem) => {
            pContext += `- ${p.record_data?.name || 'Untitled'} (template: ${p.record_data?.template || 'blank'})\n`;
            if (p.record_data?.description) {
              pContext += `  Description: ${p.record_data.description}\n`;
            }
          });
        }

        setProjectContext(pContext);
        setHasProjectAccess(true);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              '✅ Access granted. I can analyze public projects and execute module tools for the board you have open.',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load project context', error);
    } finally {
      setIsLoadingAccess(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const canvasContext = buildCanvasContext();
    const finalContext = hasProjectAccess
      ? `${canvasContext}\n\n${projectContext}`
      : canvasContext;

    try {
      const res = await fetchAPI('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [...messages, userMessage],
          workspace_context: finalContext,
          tenant_id: tenantId,
          project_id: projectId || recordId || null,
          current_module: currentModule,
          module_id: moduleId || null,
          page_id: pageId || null,
          board_id: boardId || null,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || 'API Error');
      }

      const data: AiChatResponse = await res.json();
      const assistantText =
        data.message ||
        data.reply ||
        'Done — let me know if you need anything else.';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantText },
      ]);

      await applyAgentActions(data);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Connection error occurred. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${msg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50/50 dark:bg-[#121212]">
      <div className="px-3 py-1.5 border-b border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Context: {currentModule}
        </span>
        {moduleId && (
          <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[40%]">
            {moduleId.slice(0, 8)}…
          </span>
        )}
      </div>

      {!hasProjectAccess && tenantId && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 border-b border-indigo-100 dark:border-indigo-500/20 flex flex-col gap-2 shrink-0 animate-in fade-in duration-300">
          <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium leading-tight flex items-start gap-1.5">
            <Database className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Want me to analyze your workspace projects too? (Private projects
            will be excluded).
          </p>
          <button
            onClick={handleGrantAccess}
            disabled={isLoadingAccess}
            className="bg-indigo-600 text-white text-[10px] uppercase tracking-wider font-bold py-1.5 px-3 rounded-md w-fit hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingAccess ? 'Loading...' : 'Allow Access'}
          </button>
        </div>
      )}

      {hasProjectAccess && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1.5 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
            Project Access Active
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-[#1E1E20] text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800 rounded-bl-sm'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    strong: ({ ...props }) => (
                      <span className="font-bold" {...props} />
                    ),
                    ul: ({ ...props }) => (
                      <ul className="list-disc ml-4 mt-1" {...props} />
                    ),
                    ol: ({ ...props }) => (
                      <ol className="list-decimal ml-4 mt-1" {...props} />
                    ),
                    li: ({ ...props }) => (
                      <li className="mt-0.5" {...props} />
                    ),
                    p: ({ ...props }) => (
                      <p className="mb-2 last:mb-0" {...props} />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#1E1E20] border border-zinc-200/60 dark:border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 p-3 bg-white dark:bg-[#161616] border-t border-zinc-200 dark:border-zinc-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={
              currentModule === 'kanban'
                ? 'e.g. Add a high priority task to redesign onboarding…'
                : currentModule === 'mindmap'
                  ? 'e.g. Add a node for customer onboarding…'
                  : 'Ask or request an action for this module…'
            }
            className="w-full bg-zinc-100 dark:bg-[#222222] border border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#1E1E20] rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
