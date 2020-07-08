﻿// <copyright file="thumbnail.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Image } from "@fluentui/react-northstar";
import { useTranslation } from 'react-i18next';

interface IThumbnailProps {
    isVisible: boolean;
    imageUrl?: string;
}

const Thumbnail: React.FunctionComponent<IThumbnailProps> = props => {
    const localize = useTranslation().t;
    if (props.isVisible) {
        return (
            <Image
                className="card-thumbnail"
                alt={localize("cardThumbnail")}
                src={props.imageUrl}
            />
        );
    }
    else {
        return (
            <></>
        );
    }
}

export default React.memo(Thumbnail);