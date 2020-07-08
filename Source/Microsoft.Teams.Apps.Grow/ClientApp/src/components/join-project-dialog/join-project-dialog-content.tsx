// <copyright file="join-project-dialog-content.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Button, Flex, Text, ItemLayout, Image, Provider, Label } from "@fluentui/react-northstar";
import { CloseIcon } from "@fluentui/react-icons-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import DocumentUrl from "../new-project-dialog/document-url";
import { IProjectDetails } from '../card-view/discover-wrapper-page';
import { joinProject } from "../../api/discover-api";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import Resources from "../../constants/resources";

import "../../styles/new-project-dialog.css";
import "../../styles/join-project-dialog.css";

var moment = require('moment');

interface IJoinProjectDialogContentProps extends WithTranslation {
    projectDetails: IProjectDetails;
    onSubmit: (projectId: string, isSuccess: boolean) => void;
    changeDialogOpenState: (isOpen: boolean) => void;
    loggedInUserId: string;
}

interface IJoinProjectDialogContentState {
    projectDetails: IProjectDetails;
    skillList: Array<string>;
    documentUrlList: Array<string>;
    isEditDialogOpen: boolean;
    isLoading: boolean;
    theme:string
}

class JoinProjectDialogContent extends React.Component<IJoinProjectDialogContentProps, IJoinProjectDialogContentState> {
    localize: TFunction;
    teamId = "";
    loggedInUserId: string;
    constructor(props: any) {
        super(props);

        this.localize = this.props.t;
        this.loggedInUserId = "";
        this.state = {
            skillList: [],
            documentUrlList: [],
            projectDetails: { ...this.props.projectDetails },
            isEditDialogOpen: false,
            isLoading: false,
            theme:""
        }
    }

    componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.loggedInUserId = context.userObjectId!;
            this.setState({ theme: context.theme! })
        });
        this.setState({
            skillList: this.state.projectDetails.requiredSkills.split(";"),
            documentUrlList: this.state.projectDetails.supportDocuments.split(";")
        })
    }

	/**
	*Close the dialog and pass back card properties to parent component.
	*/
    onSubmitClick = async () => {
        this.setState({
            isLoading: true
        });

        let projectDetails = this.state.projectDetails;
        projectDetails.requiredSkills = this.state.skillList.join(";");
        projectDetails.supportDocuments = this.state.documentUrlList.join(";");

        let response = await joinProject(projectDetails);
        if (response.status === 200 && response.data) {
            if (response.data !== false) {
                this.props.onSubmit(this.props.projectDetails.projectId, true);
                this.props.changeDialogOpenState(false);
            }
        }
        else {
            this.props.onSubmit(this.props.projectDetails.projectId, false);
        }

        this.setState({
            isLoading: false
        });
    }

    onSkillRemoveClick = () => {
        console.log('a');
    }

    onLinkRemoveClick = () => {
        console.log('a');
    }

	/**
	* Renders the component
	*/
    public render(): JSX.Element {

        let joinedMembersCount = 0
        if (this.state.projectDetails.projectParticipantsUserIds !== "") {
            joinedMembersCount = this.state.projectDetails.projectParticipantsUserIds.split(';').length
        }

        let startDate = moment.utc(this.state.projectDetails.projectStartDate).local().format("MM-DD-YYYY");
        let endDate = moment.utc(this.state.projectDetails.projectEndDate).local().format("MM-DD-YYYY");

        return (
            <Provider className="join-project-dialog-provider-wrapper">
                <Flex>
                    <Flex.Item grow>
                        <ItemLayout
                            className="join-project-app-name-container"
                            media={<Image className="join-project-app-logo-container" src="/Artifacts/applicationLogo.png" />}
                            header={<Text content={this.localize("dialogTitleGrowAppName")} weight="bold" />}
                            content={<Text content={this.localize("joinProjectHeading")} weight="semibold" size="small" />}
                        />
                    </Flex.Item>
                    <CloseIcon className="icon-hover" onClick={() => this.props.changeDialogOpenState(false)} />
                </Flex>
                <Flex>
                    <div className="join-project-dialog-body">
                        <Flex gap="gap.smaller" className="input-label-space-between">
                            <Flex.Item>
                                <Text className="project-title" content={this.state.projectDetails.title} />
                            </Flex.Item>
                        </Flex>
                        <div style={{fontSize:"12px"}}>
                            <Flex gap="gap.smaller" className="label-spacing joined-project-text-area input-label-space-between">
                                <Flex.Item>
                                    <Text className="joined-project-text-area" content={this.state.projectDetails.description} />
                                </Flex.Item>
                            </Flex>
                            <Flex gap="gap.small" styles={{ marginTop: "1.33rem"}}>
                                <Flex.Item styles={{ width: "9rem" }}>
                                    <Text content={this.localize("projectDurationLabel") + " :"} />
                                </Flex.Item>
                                <Flex.Item>
                                    <Text weight="semibold" content={startDate + " - " + endDate} />
                                </Flex.Item>
                            </Flex>
                            <Flex gap="gap.small" styles={{ marginTop: "1.33rem"}}>
                                <Flex.Item styles={{ width: "9rem" }}>
                                    <Text content={this.localize("teamSize") + " :"} />
                                </Flex.Item>
                                <Flex.Item>
                                    <Text weight="semibold" content={this.state.projectDetails.teamSize} />
                                </Flex.Item>
                            </Flex>
                            <Flex gap="gap.small" styles={{ marginTop: "1.33rem"}}>
                                <Flex.Item styles={{ width: "9rem" }}>
                                    <Text content={this.localize("membersJoinedLabel") + " :"} />
                                </Flex.Item>
                                <Flex.Item>
                                    <Text weight="semibold" content={joinedMembersCount} />
                                </Flex.Item>
                            </Flex>
                            <Flex gap="gap.smaller" vAlign="center" className="label-spacing input-label-space-between">
                                <Text content={this.localize("skillsNeededLabel") + " :"} />
                            </Flex>
                            <Flex gap="gap.smaller" className="skills-flex skills-new-project" vAlign="center">
                                <div>
                                    {
                                        this.state.skillList.map((value: string, index) => {
                                            if (value.trim().length > 0) {
                                                return <Label
                                                    styles={{ padding: "1rem" }}
                                                    circular
                                                    content={<Text className="tag-text-form" content={value.trim()} title={value.trim()} size="small" />}
                                                    className={this.state.theme === Resources.dark ? "tags-label-wrapper-dark" : "tags-label-wrapper"}
                                                />
                                            }
                                        })
                                    }
                                </div>
                            </Flex>
                            <Flex gap="gap.smaller" className="label-spacing input-fields-margin-between-add-post">
                                <Text content={this.localize("docLinkFormLabel") + " :"} />
                            </Flex>
                            <Flex gap="gap.smaller" className="document-url-flex" vAlign="center">
                                <div>
                                    {
                                        this.state.documentUrlList.map((value: string, index) => {
                                            if (value.trim().length > 0) {
                                                return <DocumentUrl showDeleteIcon={false} index={index} urlContent={value.trim()} onRemoveClick={() => { }} />
                                            }
                                            else {
                                                return <Text className="no-url-added" content={this.localize("noLinksAdded")} />
                                            }
                                        })
                                    }
                                </div>
                            </Flex>
                        </div>
                    </div>
                </Flex>
                {
                    (this.state.projectDetails.status === 1 || this.state.projectDetails.status === 2) &&
                        !this.state.projectDetails.projectParticipantsUserIds.split(';').includes(this.props.loggedInUserId) &&
                        this.state.projectDetails.createdByUserId !== this.loggedInUserId &&
                        this.state.projectDetails.projectParticipantsUserIds.split(';').filter((userId) => userId).length < this.state.projectDetails.teamSize
                            ? <Flex className="join-project-dialog-footer-wrapper">
                                <Flex gap="gap.smaller" className="join-project-dialog-footer input-fields-margin-between-add-post">
                                    <Flex.Item push>
                                        <Button content={this.localize("joinButtonText")} primary loading={this.state.isLoading} disabled={this.state.isLoading} onClick={this.onSubmitClick} />
                                    </Flex.Item>
                                </Flex>
                            </Flex>
                            : <></>
                }
            </Provider>
        );
    }
}

export default withTranslation()(JoinProjectDialogContent)