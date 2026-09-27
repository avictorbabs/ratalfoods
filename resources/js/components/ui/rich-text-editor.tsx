import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    List,
    ListOrdered,
    Redo2,
    Strikethrough,
    Undo2,
} from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
};

function toEditorContent(value: string): string {
    if (!value.trim()) {
        return '';
    }

    if (/<[a-z][\s\S]*>/i.test(value)) {
        return value;
    }

    return value
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

type ToolbarButtonProps = {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    label: string;
    children: ReactNode;
};

function ToolbarButton({ onClick, isActive, disabled, label, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
                isActive && 'bg-muted text-foreground',
            )}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Write something…',
    className,
    id,
}: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: toEditorContent(value),
        editorProps: {
            attributes: {
                id,
                class: cn(
                    'rich-text-editor min-h-[160px] px-3 py-2 font-body text-sm text-foreground focus:outline-none',
                ),
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            const html = currentEditor.isEmpty ? '' : currentEditor.getHTML();
            onChange(html);
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        const currentHtml = editor.isEmpty ? '' : editor.getHTML();
        const nextHtml = toEditorContent(value);

        if (currentHtml !== nextHtml) {
            editor.commands.setContent(nextHtml, { emitUpdate: false });
        }
    }, [editor, value]);

    if (!editor) {
        return (
            <div
                className={cn(
                    'min-h-[200px] rounded-md border border-input bg-transparent shadow-sm',
                    className,
                )}
            />
        );
    }

    return (
        <div className={cn('overflow-hidden rounded-md border border-input bg-transparent shadow-sm', className)}>
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    label="Bold"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    label="Italic"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    label="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>

                <span className="mx-1 h-5 w-px bg-border" aria-hidden />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    label="Heading"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    label="Subheading"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <span className="mx-1 h-5 w-px bg-border" aria-hidden />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    label="Bullet list"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    label="Numbered list"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>

                <span className="mx-1 h-5 w-px bg-border" aria-hidden />

                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    label="Undo"
                >
                    <Undo2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    label="Redo"
                >
                    <Redo2 className="h-4 w-4" />
                </ToolbarButton>
            </div>

            <EditorContent editor={editor} />
        </div>
    );
}

export function stripHtml(html: string | null): string {
    if (!html) {
        return '';
    }

    if (typeof document === 'undefined') {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');

    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
