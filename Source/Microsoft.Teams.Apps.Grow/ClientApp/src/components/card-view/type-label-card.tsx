﻿// <copyright file="type-label-card.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Text, Status } from "@fluentui/react-northstar";
import { useTranslation } from 'react-i18next';
import { IPostType } from "../../constants/resources";
import { getLocalizedPostTypes } from "../../helpers/helper";

interface ITypeLabelProps {
    postType: string;
    color: string;
}

const TypeLabelCard: React.FunctionComponent<ITypeLabelProps> = props => {
    const localize = useTranslation().t;
    const postTypes: Array<IPostType> = getLocalizedPostTypes(localize);

    const postType = postTypes.filter((value) => {
        if (value.id === props.postType) {
            return value;
        }
    });
    return (
        <span><Status styles={{ backgroundColor: postType[0].color }} /> <Text content={postType[0].name} className="post-type" title={postType[0].name} size="smaller" /></span>
    );
}

export default React.memo(TypeLabelCard);