// <copyright file="new-project-dialog.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Dialog, Button } from "@fluentui/react-northstar";
import NewProjectContentDialog from "./new-project-dialog-content";
import { IProjectDetails } from "../card-view/discover-wrapper-page";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";

import "../../styles/new-project-dialog.css";

interface IAddNewProjectProps extends WithTranslation {
    onSubmit: (isSuccess: boolean, getSubmittedPost: IProjectDetails) => void;
    projectDetails: Array<IProjectDetails>;
}

interface IAddNewProjectState {
    editDialogOpen: boolean;
}

class AddNewProjectDialog extends React.Component<IAddNewProjectProps, IAddNewProjectState> {
    localize: TFunction;

    constructor(props: any) {
        super(props);

        this.localize = this.props.t;
        this.state = {
            editDialogOpen: false
        }
    }

	/**
	*Changes dialog open state to show and hide dialog.
	*@param isOpen Boolean indication whether to show dialog
	*/
    changeDialogOpenState = (isOpen: boolean) => {
        this.setState({ editDialogOpen: isOpen })
    }

	/**
    * Renders the component
    */
    public render(): JSX.Element {
        return (
            <Dialog
                className="dialog-container"
                content={
                    <NewProjectContentDialog
                        projectDetails={this.props.projectDetails}
                        onSubmit={this.props.onSubmit}
                        changeDialogOpenState={this.changeDialogOpenState}
                    />
                }
                open={this.state.editDialogOpen}
                onOpen={() => this.setState({ editDialogOpen: true })}
                trigger={<Button className="mobile-button new-project" content={this.localize("addNew")} onClick={() => this.changeDialogOpenState(true)} primary />}
            />
        );
    }
}
export default withTranslation()(AddNewProjectDialog)