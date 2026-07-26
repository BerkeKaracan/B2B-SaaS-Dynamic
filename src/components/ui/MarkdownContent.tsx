'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import type { PluggableList } from 'unified';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { preprocessAiMarkdown } from '@/lib/markdownFormat';

/** Allow GFM tables + code language class while stripping dangerous HTML. */
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className']],
    th: [...(defaultSchema.attributes?.th || []), ['align']],
    td: [...(defaultSchema.attributes?.td || []), ['align']],
    a: [
      ...(defaultSchema.attributes?.a || []),
      ['href'],
      ['target'],
      ['rel'],
      ['title'],
    ],
  },
};

const remarkPlugins: PluggableList = [remarkGfm];
const rehypePlugins: PluggableList = [[rehypeSanitize, sanitizeSchema]];

type Variant = 'default' | 'compact';

export type MarkdownContentProps = {
  children: string | null | undefined;
  className?: string;
  /** compact = chat bubbles; default = full AI pages / canvas */
  variant?: Variant;
  /** Skip AI cleanup (rare: already-clean CMS markdown). */
  raw?: boolean;
};

function buildComponents(variant: Variant): Components {
  const tight = variant === 'compact';
  const pMb = tight ? 'mb-2 last:mb-0' : 'mb-3 last:mb-0';
  const listMy = tight ? 'my-1.5' : 'my-2';
  const listPad = tight ? 'ml-4 space-y-0.5' : 'ml-4 space-y-1';
  const hMt = tight ? 'mt-3 mb-1.5' : 'mt-4 mb-2';

  return {
    h1: ({ children }) => (
      <h1 className={`${hMt} text-xl font-bold tracking-tight first:mt-0`}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={`${hMt} text-lg font-bold tracking-tight first:mt-0`}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={`${hMt} text-base font-semibold first:mt-0`}>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className={`${hMt} text-sm font-semibold first:mt-0`}>{children}</h4>
    ),
    p: ({ children }) => (
      <p className={`${pMb} leading-relaxed whitespace-pre-wrap`}>{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-inherit">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className={`list-disc ${listPad} ${listMy}`}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={`list-decimal ${listPad} ${listMy}`}>{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-600 dark:text-teal-400 underline underline-offset-2 hover:opacity-80 wrap-break-word"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 my-2 text-zinc-600 dark:text-zinc-400 italic">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-4 border-0 border-t border-zinc-200 dark:border-zinc-700" />
    ),
    del: ({ children }) => (
      <del className="line-through opacity-70">{children}</del>
    ),
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className?.includes('language-'));
      if (isBlock) {
        return (
          <code className={`${className || ''} text-[12px]`} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 text-[0.85em] font-mono text-zinc-800 dark:text-zinc-100"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="my-2 overflow-x-auto rounded-xl bg-zinc-900 text-zinc-50 p-3 text-[12px] leading-relaxed">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="my-3 w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full border-collapse text-left text-[13px]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-zinc-50 dark:bg-zinc-800/80">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="even:bg-zinc-50/60 dark:even:bg-zinc-800/40">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 font-semibold border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 align-top border-b border-zinc-100 dark:border-zinc-800">
        {children}
      </td>
    ),
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ''}
        className="my-2 max-w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-700"
        loading="lazy"
      />
    ),
    input: ({ checked, ...props }) => (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled
        readOnly
        className="mr-2 align-middle accent-teal-600"
        {...props}
      />
    ),
  };
}

/**
 * Full GFM markdown renderer for AI / chat / canvas text.
 * Uses react-markdown + remark-gfm + rehype-sanitize.
 */
export function MarkdownContent({
  children,
  className = '',
  variant = 'default',
  raw = false,
}: MarkdownContentProps) {
  const source = raw
    ? String(children ?? '')
    : preprocessAiMarkdown(children);

  if (!source) return null;

  return (
    <div
      className={`markdown-content max-w-none text-inherit wrap-break-word ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={buildComponents(variant)}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownContent;
