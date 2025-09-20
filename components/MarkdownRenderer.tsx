import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // This helper function processes a single line for bold tags
    const processLine = (line: string): React.ReactNode => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) { // Content within **...**
                return <strong key={index} className="font-semibold text-slate-100">{part}</strong>;
            }
            return part;
        });
    };

    const elements: React.ReactNode[] = [];
    // Split content by newline to process line by line
    const lines = content.split('\n');
    let currentList: string[] = [];

    // Helper to render the current list and clear it
    const flushList = () => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 my-4 pl-4">
                    {currentList.map((item, index) => (
                        <li key={index}>{processLine(item)}</li>
                    ))}
                </ul>
            );
            currentList = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        // Check for list items
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            currentList.push(trimmedLine.substring(2));
        } else {
            // If it's not a list item, the current list (if any) has ended
            flushList();
            // Render non-empty lines as paragraphs
            if (trimmedLine) {
                elements.push(<p key={`p-${index}`} className="mb-4">{processLine(line)}</p>);
            }
        }
    });

    // Flush any remaining list items at the end of the content
    flushList();

    return <>{elements}</>;
};

export default MarkdownRenderer;