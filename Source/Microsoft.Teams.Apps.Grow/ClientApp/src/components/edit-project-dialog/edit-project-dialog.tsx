// <copyright file="edit-project-dialog.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Dialog } from "@fluentui/react-northstar";
import EditProjectContentDialog from "./edit-project-dialog-content";
import { IProjectDetails } from "../card-view/discover-wrapper-page";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";

import "../../styles/new-project-dialog.css";

interface IEditProjectProps extends WithTranslation {
    index: number;
    triggerComponent: JSX.Element;
    projectDetails: Array<IProjectDetails>
    onSubmit: (editedCardDetails: IProjectDetails, isSuccess: boolean) => void;
    cardDetails: IProjectDetails;
    onCancel: () => void;

}

interface IEditProjectState {
    editDialogOpen: boolean;
}

class AddNewProjectDialog extends React.Component<IEditProjectProps, IEditProjectState> {
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
                    <EditProjectContentDialog
                        allProjectDetails={this.props.projectDetails}
                        projectDetails={this.props.cardDetails}
                        onSubmit={this.props.onSubmit}
                        changeDialogOpenState={this.changeDialogOpenState}
                    />
                }
                open={this.state.editDialogOpen}
                onOpen={() => this.setState({ editDialogOpen: true })}
                trigger={this.props.triggerComponent}
            />
        );
    }
}
export default withTranslation()(AddNewProjectDialog)