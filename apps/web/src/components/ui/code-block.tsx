'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
    code: string;
    language?: string;
    showCopy?: boolean;
    maxHeight?: string;
    className?: string;
}

export function CodeBlock({
    code,
    language = 'rust',
    showCopy = true,
    maxHeight = '300px',
    className,
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn('relative rounded-lg overflow-hidden', className)}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    <span className="ml-4 text-xs text-gray-400">{language}</span>
                </div>
                {showCopy && (
                    <button
                        onClick={handleCopy}
                        className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
                            copied
                                ? 'text-green-400 bg-green-400/10'
                                : 'text-gray-400 hover:text-white hover:bg-[#333]'
                        )}
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Code content */}
            <div
                className="overflow-auto"
                style={{ maxHeight }}
            >
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{
                        margin: 0,
                        padding: '16px',
                        background: 'rgb(4 13 36)',
                        fontSize: '13px',
                        lineHeight: '1.6',
                    }}
                    lineNumberStyle={{
                        minWidth: '2.5em',
                        paddingRight: '1em',
                        color: '#6e7681',
                        userSelect: 'none',
                    }}
                >
                    {code.trim()}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
