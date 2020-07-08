// <copyright file="upvotes.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Text, Label } from "@fluentui/react-northstar";
import { TeamsIcon } from "@fluentui/react-icons-northstar";

interface IUpvotesProps {
    totalJoined: string;
    teamSize: string;
    isSelected: boolean;
}

const Upvotes: React.FunctionComponent<IUpvotesProps> = props => {

    return (
        <Label
            circular
            icon={<TeamsIcon outline />}
            iconPosition={"start"}
            content={<div className="tag-text-card"><Text className="tag-text-card" content={props.totalJoined + "/" + props.teamSize} size="small" /></div>}
            className="teamsize-label-wrapper"
        />
    );
}

export default React.memo(Upvotes);