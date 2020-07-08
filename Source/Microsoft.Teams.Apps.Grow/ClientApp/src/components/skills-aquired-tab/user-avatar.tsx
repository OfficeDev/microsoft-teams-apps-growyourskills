﻿// <copyright file="user-avatar.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { Text, Flex } from "@fluentui/react-northstar";
import { TFunction } from "i18next";
import { generateColor, getInitials } from "../../helpers/helper";


interface IUserAvatarProps extends WithTranslation {
    content: string;
    title: string;
    postType: string;
    showFullName: boolean;
}


class UserAvatar extends React.Component<IUserAvatarProps> {
    localize: TFunction;
    constructor(props: IUserAvatarProps) {
        super(props);
        this.localize = this.props.t;
    }

    /**
     * Renders the component.
     */
    public render(): JSX.Element {
        return (
            <Flex vAlign="center">
                <div className="user-avatar" style={{ backgroundColor: generateColor() }}>
                    <Text content={getInitials(this.props.content)} title={this.props.content} />
                </div>
                {this.props.showFullName && <>&nbsp;<Text className="author-name" title={this.props.content} content={this.props.content} /></>}
            </Flex>
        )

    }
}

export default withTranslation()(UserAvatar)
