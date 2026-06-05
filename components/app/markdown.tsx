'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

// Renders Markdown to safe HTML. react-markdown does NOT execute raw HTML (no rehype-raw plugin),
// so teacher-authored content cannot inject <script> — stored-XSS-safe by construction. GFM adds
// tables / task lists / strikethrough / autolinks. Styled with @tailwindcss/typography `prose`.
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <article
      className={cn(
        'prose prose-slate max-w-none dark:prose-invert',
        'prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-a:text-primary prose-a:font-medium hover:prose-a:underline',
        'prose-pre:bg-muted prose-pre:text-foreground prose-pre:ring-1 prose-pre:ring-border',
        'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none',
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
        'prose-img:rounded-lg prose-img:ring-1 prose-img:ring-border prose-hr:border-border',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </article>
  )
}
