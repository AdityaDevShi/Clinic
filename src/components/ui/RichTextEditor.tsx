
'use client';

import dynamic from 'next/dynamic';
import React, { SetStateAction, Dispatch } from 'react';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: Dispatch<SetStateAction<string>> | ((val: string) => void);
    placeholder?: string;
    readOnly?: boolean;
}

// Dynamic import with ssr: false to prevent hydration mismatch
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Define modules and formats outside to prevent re-creation on render (fixes infinite loop)
const modules = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']                                         // remove formatting button
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent', // Removed 'bullet' as it is covered by 'list'
    'link', 'image'
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, readOnly = false }) => {
    return (
        <div className="rich-text-editor">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={readOnly ? { toolbar: false } : modules}
                formats={formats}
                readOnly={readOnly}
                placeholder={placeholder}
                className="bg-white rounded-lg"
            />
            <style jsx global>{`
                .ql-container.ql-snow {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    font-family: inherit;
                    font-size: 1rem;
                    min-height: 150px;
                }
                .ql-toolbar.ql-snow {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    font-family: inherit;
                    background-color: #f9fafb;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
