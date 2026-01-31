import React from 'react';
import Markdown, { MarkdownProps } from 'react-native-markdown-display';

export const MarkdownDisplay = (props: MarkdownProps) => {
    return <Markdown {...props} />;
};
