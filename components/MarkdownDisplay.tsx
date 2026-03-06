import React from 'react';
import Markdown, { MarkdownProps } from 'react-native-markdown-display';

export const MarkdownDisplay = ({ children, ...props }: MarkdownProps & { children: string }) => {
    return <Markdown {...props}>{children}</Markdown>;
};
