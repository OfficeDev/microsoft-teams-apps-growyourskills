﻿// <copyright file="no-post-added-page.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from 'react';
import { Text } from "@fluentui/react-northstar";
import { EyeIcon } from "@fluentui/react-icons-northstar";
import NewProjectDialog from "../new-project-dialog/new-project-dialog";
import { IProjectDetails } from "../card-view/discover-wrapper-page";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";

import "../../styles/no-post-added-page.css";

interface INoPostAddedProps extends WithTranslation {
    onNewPostSubmit: (isSuccess: boolean, getSubmittedPost: IProjectDetails) => void;
    showAddPost: boolean;
}

class TeamsConfigPage extends React.Component<INoPostAddedProps> {
    localize: TFunction;
    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
    }

    public render(): JSX.Element {

        let projectDetails: Array<IProjectDetails> = [];
        return (
            <div className="no-post-added-container">
                <div className="app-logo">
                    <EyeIcon size="largest" />
                </div>
                <div className="no-data-preview">
                    <Text content={this.localize("noDataPreviewNote")} />
                </div>
                <div className="add-new-post">
                    <Text content={this.localize("addNewPostNote")} />
                </div>
                {this.props.showAddPost && <div className="add-new-post-btn">
                    <NewProjectDialog projectDetails={projectDetails} onSubmit={this.props.onNewPostSubmit} />
                </div>}
            </div>
        )
    }
}

export default withTranslation()(TeamsConfigPage)