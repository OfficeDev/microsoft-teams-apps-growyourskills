// <copyright file="more-menu-content.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Flex, Text, Divider, Dialog, Provider } from "@fluentui/react-northstar";
import { TrashCanIcon, LeaveIcon } from "@fluentui/react-icons-northstar";
import JoinProjectDialog from "../join-project-dialog/join-project-dialog-wrapper";
import { Container } from "react-bootstrap";
import { IProjectDetails } from "./discover-wrapper-page";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import * as microsoftTeams from "@microsoft/teams-js";
import CloseProjectDialog from "../close-project/close-project-dialog";

import "../../styles/more-menu-content.css";
import Resources from "../../constants/resources";
interface IAppState {
    theme: string;
}

interface IMoreMenuContentProps extends WithTranslation {
    cardDetails: IProjectDetails;
    projectDetails: Array<IProjectDetails>;
    onMenuItemClick: (key: any) => void;
    onJoinMenuItemClick: (projectId: string, isSuccess: boolean) => void;
    onCancel: () => void;
    onEditSubmit: (editedCardDetails: any, isSuccess: boolean) => void;
    onCloseProjectButtonClick: (isSuccess: boolean, projectId: string) => void;
    showJoinProjectMenu: boolean;
    showLeaveProjects: boolean;
}

class MoreMenuContent extends React.Component<IMoreMenuContentProps, IAppState> {
    localize: TFunction;

    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
        this.state = {
            theme: Resources.default,
        }
    }

    componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.setState({ theme: context.theme! });
        });
    }

    /**
	* Renders the component
	*/
    public render(): JSX.Element {
        let className = this.state.theme === Resources.dark ? "dark-menu-items-wrapper" : this.state.theme === Resources.contrast ? "contrast-menu-items-wrapper" : "default-menu-items-wrapper";
        return (
            <Provider>
                {
                    this.props.showLeaveProjects ?
                        <Container fluid className="popup-menu-content-wrapper">
                            <Dialog
                                className="dialog-container-discover-posts"
                                cancelButton={this.localize("cancel")}
                                confirmButton={this.localize("Confirm")}
                                content={this.localize("leaveConfirmBodyText")}
                                header={this.localize("leaveConfirmTitleText")}
                                trigger={<Flex vAlign="center" className={className}><LeaveIcon outline /> <Text className="popup-menu-item-text" content={this.localize("leaveProject")} /></Flex>}
                                onConfirm={() => this.props.onMenuItemClick(4)}
                            />
                        </Container>
                        :
                        <Container fluid className="popup-menu-content-wrapper">
                            {
                                this.props.showJoinProjectMenu &&
                                    !this.props.cardDetails.isCurrentUserProject &&
                                    (this.props.cardDetails.status === 2 || this.props.cardDetails.status === 1)
                                    ?
                                    <JoinProjectDialog
                                        index={1}
                                        cardDetails={this.props.cardDetails}
                                        onSubmit={this.props.onJoinMenuItemClick}
                                        onCancel={this.props.onCancel}
                                    /> : <></>
                            }
                            {this.props.cardDetails.isCurrentUserProject && <>
                                {
                                    this.props.cardDetails.status === 2
                                        ?
                                        <>
                                            <CloseProjectDialog cardDetails={this.props.cardDetails} onCloseProjectButtonClick={this.props.onCloseProjectButtonClick} />
                                            <Divider /> 
                                        </>
                                        :
                                        <></>
                                }
                                <Dialog
                                    className="dialog-container-discover-posts"
                                    cancelButton={this.localize("cancel")}
                                    confirmButton={this.localize("Confirm")}
                                    content={this.localize("deleteConfirmBodyText")}
                                    header={this.localize("deleteConfirmTitleText")}
                                    trigger={<Flex vAlign="center" className={className}><TrashCanIcon outline /> <Text className="popup-menu-item-text" content={this.localize("delete")} /></Flex>}
                                    onConfirm={() => this.props.onMenuItemClick(3)}
                                /></>}
                        </Container>
                }
            </Provider>
        );
    }
}
export default withTranslation()(MoreMenuContent)