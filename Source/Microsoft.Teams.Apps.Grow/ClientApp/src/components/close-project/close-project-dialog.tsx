// <copyright file="close-project-dialog.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Dialog, Flex, Text, AcceptIcon } from "@fluentui/react-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import CloseProjectWrapper from './close-project-wrapper';
import { IProjectDetails } from "../card-view/discover-wrapper-page";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../styles/close-project.css";
import "../../styles/more-menu-content.css";

interface ICloseProjectTableProps extends WithTranslation {
    onCloseProjectButtonClick: (isSuccess: boolean, projectId: string) => void;
    cardDetails: IProjectDetails;
}

interface ICloseProjectTableState {
    editDialogOpen: boolean;
}

class CloseProjectTable extends React.Component<ICloseProjectTableProps, ICloseProjectTableState> {

    localize: TFunction;
    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
        this.state = {
            editDialogOpen: false
        }
    }

    /**
    * Used to initialize Microsoft Teams sdk
    */
    async componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {

        });
    }

    /**
    *Changes dialog open state to show and hide dialog.
    *@param isOpen Boolean indication whether to show dialog
    */
    changeDialogOpenState = (isOpen: boolean) => {
        this.setState({ editDialogOpen: isOpen })
    }

    /**
    *Changes dialog open state to show and hide dialog.
    *@param isOpen Boolean indication whether to show dialog
    */
    closeDialog = (isOpen: boolean) => {
        this.setState({ editDialogOpen: isOpen })
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        return (<>
            <Dialog
                className="dialog-container-close-project"
                content={
                    <CloseProjectWrapper cardDetails={this.props.cardDetails} onCloseProjectButtonClick={this.props.onCloseProjectButtonClick} closeDialog={this.closeDialog} />
                }
                open={this.state.editDialogOpen}
                onOpen={() => this.setState({ editDialogOpen: true })}
                trigger={
                    <Flex vAlign="center" className="default-menu-items-wrapper" onClick={() => this.changeDialogOpenState(true)}>
                        <AcceptIcon outline /> <Text className="trigger-text" content={this.localize("closeProject")} />
                    </Flex>
                }
            />
        </>)
    }

}
export default withTranslation()(CloseProjectTable)