import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
    content: string;
    className?: string;
    components?: Partial<Components>;
}

const MarkdownRenderer = ({ content, className = '', components }: MarkdownRendererProps) => {
    const defaultComponents: Components = {
        h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3 mt-6">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-semibold mb-2 mt-4">{children}</h3>,
        p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-4">{children}</li>,
        code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            if (isInline) {
                return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
            }
            return (
                <code className="block bg-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                    {children}
                </code>
            );
        },
    };

    return (
        <div className={`prose prose-slate max-w-none ${className}`}>
            <ReactMarkdown components={{ ...defaultComponents, ...components }}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;