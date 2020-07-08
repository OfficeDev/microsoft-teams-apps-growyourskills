// <copyright file="tag.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Label, Text } from "@fluentui/react-northstar";
import { CloseIcon } from "@fluentui/react-icons-northstar";

interface ISkillsProps {
    skillContent: string;
    index: number;
    projectMemberIndex: number
    showRemoveIcon: boolean;
    onRemoveClick?: (index: number, projectMemberIndex: number) => void
}

const Skills: React.FunctionComponent<ISkillsProps> = props => {

	/**
    *Invoked when 'X' icon is clicked of the label and passes control back to parent component.
    */
    const onRemoveClick = () => {
        props.onRemoveClick!(props.index, props.projectMemberIndex);
    }

    // Check whether remove icon is to be displayed or not
    if (props.showRemoveIcon) {
        return (
            <Label
                circular
                content={<Text className="skills-text-form" content={props.skillContent} title={props.skillContent} size="small" />}
                className="skills-label-wrapper"
                icon={<CloseIcon key={props.index}
                onClick={onRemoveClick} />}
            />
        );
    }
    else {
        return (
            <Label
                circular
                content={<Text className="skills-text-form" content={props.skillContent} title={props.skillContent} size="small" />}
                className="skills-label-wrapper"
            />
        )
    }
}

export default React.memo(Skills);