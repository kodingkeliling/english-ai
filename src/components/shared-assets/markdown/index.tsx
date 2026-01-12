"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MarkdownProps {
    content: string;
    className?: string;
    isTruncated?: boolean;
    lineClamp?: number;
    maxLength?: number;
}

/**
 * Safely truncates content by character length while keeping HTML tags and LaTeX blocks intact.
 * If a tag or LaTeX block starts before the limit, it is included in its entirety.
 */
const truncateContent = (content: string, maxLength: number) => {
    if (!content || content.length <= maxLength) return content;

    // Regex to match:
    // 1. HTML tags: <...>
    // 2. LaTeX Display Math: $$...$$ or \[...\]
    // 3. LaTeX Inline Math: $...$ or \(...\)
    // 4. Normal text
    const pattern = /(<[^>]+>|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|(?<!\\)\$[^\$]+?(?<!\\)\$|[^<\\$]+)/g;
    const tokens = content.match(pattern) || [];

    let result = '';
    let currentLength = 0;
    let isActuallyTruncated = false;

    for (const token of tokens) {
        const isTag = token.startsWith('<');
        const isLatex = token.startsWith('$') || token.startsWith('\\');

        if (isTag || isLatex) {
            // If we're still under the limit, include the entire block/tag
            if (currentLength < maxLength) {
                result += token;
                // Count LaTeX content towards length, but tags are "free" to keep structure
                if (isLatex) {
                    currentLength += token.length;
                }
            } else {
                isActuallyTruncated = true;
                break;
            }
        } else {
            // Normal text
            if (currentLength + token.length > maxLength) {
                const remaining = maxLength - currentLength;
                result += token.substring(0, remaining);
                currentLength = maxLength;
                isActuallyTruncated = true;
                break;
            } else {
                result += token;
                currentLength += token.length;
            }
        }
    }

    if (isActuallyTruncated) {
        // Clean up and add ellipsis
        result = result.trimEnd();
        if (!result.endsWith('...')) {
            result += '...';
        }
    }

    return result;
};

// Helper to normalize LaTeX delimiters and handle math inside HTML tags
const preprocessContent = (content: string, isTruncated: boolean = false) => {
    if (!content) return '';

    // 0. Normalize line endings
    let processed = content.replace(/\r\n/g, '\n');

    // 1. Convert newlines to paragraphs IF it's raw text (not HTML)
    // This satisfies the "HTML style" request where \n becomes <p></p>
    const hasHtml = /<[a-z][\s\S]*>/i.test(processed);
    if (!hasHtml) {
        if (isTruncated) {
            // No paragraph wrapping for truncated text to keep it simple
            processed = processed.replace(/\n/g, ' ');
        } else {
            processed = processed
                .split('\n')
                .map(line => `<p>${line || '<br/>'}</p>`)
                .join('');
        }
    }

    // 2. Normalize and convert Display Math: \[ ... \] or $$ ... $$
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, p1) => {
        const math = p1.trim();
        return `<span data-type="latex" data-latex="${math.replace(/"/g, '&quot;')}" class="latex-node inline-block align-middle" data-display="${!isTruncated}"></span>`;
    });

    processed = processed.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, p1) => {
        const math = p1.trim();
        return `<span data-type="latex" data-latex="${math.replace(/"/g, '&quot;')}" class="latex-node inline-block align-middle" data-display="${!isTruncated}"></span>`;
    });

    // 3. Normalize and convert Inline Math: \( ... \) or $ ... $
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, p1) => {
        const math = p1.trim();
        return `<span data-type="latex" data-latex="${math.replace(/"/g, '&quot;')}" class="latex-node inline-block align-middle"></span>`;
    });

    // Permissive regex for $ ... $ to handle AI output that might include spaces
    processed = processed.replace(/(?<!\\)\$([^\$]+?)(?<!\\)\$/g, (_, p1) => {
        const math = p1.trim();
        // Skip if empty or just whitespace
        if (!math) return '$ $';
        return `<span data-type="latex" data-latex="${math.replace(/"/g, '&quot;')}" class="latex-node inline-block align-middle"></span>`;
    });

    return processed;
};

export const Markdown = ({ content, className = '', isTruncated = false, lineClamp = 1, maxLength }: MarkdownProps) => {
    if (!content) return null;

    // Apply character truncation if requested
    const truncatedContent = (isTruncated && maxLength)
        ? truncateContent(content, maxLength)
        : content;

    // Normalize content
    const normalizedContent = preprocessContent(truncatedContent, isTruncated);

    // Basic styling via Tailwind typography (prose) + custom className
    const containerClasses = isTruncated
        ? `block text-gray-900 dark:text-white line-clamp-${lineClamp} overflow-hidden ${className}`
        : `prose prose-sm dark:prose-invert max-w-none [&&_p]:leading-relaxed ${className}`;

    return (
        <div className={containerClasses}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .katex-display {
                    overflow-x: auto;
                    overflow-y: hidden;
                    padding: 0.25em 0;
                    margin: 0;
                    max-width: 100%;
                }
                .katex-mathml {
                    display: none !important;
                }
                .katex-html {
                    display: inline-block;
                    vertical-align: middle;
                }
                .katex {
                    white-space: nowrap;
                    text-indent: 0;
                    line-height: normal;
                }
            `}} />
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeRaw, [rehypeKatex, { output: 'html' }]]}
                components={{
                    // Override basic elements if needed to match previous styles
                    p: ({ node, ...props }) => <p {...props} className="mb-1! mt-0! last:mb-0 leading-relaxed" />,
                    h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold mb-3 mt-6 first:mt-0" />,
                    h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-bold mb-2.5 mt-5 first:mt-0" />,
                    h3: ({ node, ...props }) => <h3 {...props} className="text-base font-bold mb-2 mt-4 first:mt-0" />,
                    ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 mb-3 space-y-1" />,
                    ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 mb-3 space-y-1" />,
                    li: ({ node, ...props }) => <li {...props} className="leading-relaxed" />,
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />,
                    // Handle Tiptap and preprocessed LaTeX spans
                    span: ({ node, ...props }: React.HTMLAttributes<HTMLSpanElement> & { node?: any; 'data-latex'?: string; 'data-display'?: string | boolean }) => {
                        const latex = props['data-latex'];
                        if (latex) {
                            try {
                                const isDisplay = props['data-display'] === 'true' || props['data-display'] === true;
                                const html = katex.renderToString(latex, {
                                    throwOnError: false,
                                    displayMode: isDisplay,
                                });

                                // Use div for display mode to allow proper block behavior, span for inline
                                const Component = isDisplay ? 'div' : 'span';

                                return (
                                    <Component
                                        {...props}
                                        className={`${props.className || ''} ${isDisplay ? 'w-full overflow-x-auto my-2' : 'inline-block align-middle'}`}
                                        dangerouslySetInnerHTML={{ __html: html }}
                                    />
                                );
                            } catch (error) {
                                console.error('LaTeX error:', error);
                                return <span {...props}>{latex}</span>;
                            }
                        }
                        return <span {...props} />;
                    }
                }}
            >
                {normalizedContent}
            </ReactMarkdown>
        </div>
    );
}
