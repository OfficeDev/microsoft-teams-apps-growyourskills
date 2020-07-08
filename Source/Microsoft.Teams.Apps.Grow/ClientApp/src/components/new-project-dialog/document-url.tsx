// <copyright file="document-url.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Text, Flex } from "@fluentui/react-northstar";
import { TrashCanIcon } from "@fluentui/react-icons-northstar";

interface IDocumentUrlProps {
    urlContent: string;
    index: number;
    showDeleteIcon: boolean;
    onRemoveClick?: (index: number) => void
}

const DocumentUrl: React.FunctionComponent<IDocumentUrlProps> = props => {

    /**
    *Invoked when 'X' icon is clicked of the label and passes control back to parent component.
    */
    const navigateDocument = () => {
        window.open(props.urlContent, "_blank");
    }

	/**
    *Invoked when 'X' icon is clicked of the label and passes control back to parent component.
    */
    const onRemoveClick = () => {
        props.onRemoveClick!(props.index);
    }
    if (props.showDeleteIcon) {
        return (
            <Flex styles={{ marginTop:"1rem" }}>
                <Flex.Item grow>
                    <Text className="document-url-text-form" onClick={navigateDocument} content={props.urlContent} title={props.urlContent} />
                </Flex.Item>
                <Flex.Item>
                    <TrashCanIcon outline key={props.index} onClick={onRemoveClick} />
                </Flex.Item>
            </Flex>
        );
    }
    else {
        return (
            <Text className="document-url-text-form" onClick={navigateDocument} content={props.urlContent} title={props.urlContent} />
        );
    }
}

export default React.memo(DocumentUrl);