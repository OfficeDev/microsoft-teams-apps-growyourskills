// <copyright file="join-project-dialog.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Button, Flex, Text, Provider, Label } from "@fluentui/react-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import DocumentUrl from "../new-project-dialog/document-url";
import { IProjectDetails } from '../card-view/discover-wrapper-page';
import { getProjectDetailToJoin } from "../../api/discover-api";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import Resources from "../../constants/resources";

import "../../styles/join-project-taskmodule-view.css";
import "../../styles/new-project-dialog.css";

var moment = require('moment');

interface IJoinProjectDialogContentState {
    projectDetails: IProjectDetails;
    skillList: Array<string>;
    documentUrlList: Array<string>;
    isEditDialogOpen: boolean;
    isLoading: boolean;
    showLoader: boolean;
    theme: string;
}

class JoinProjectDialogContent extends React.Component<WithTranslation
    , IJoinProjectDialogContentState> {
    localize: TFunction;
    teamId = "";
    projectId = "";
    currentUserId = "";
    createdByUserId = "";
    upn = "";

    constructor(props: any) {
        super(props);

        this.localize = this.props.t;

        let search = window.location.search;
        let params = new URLSearchParams(search);
        this.projectId = params.get("projectId")!;
        this.currentUserId = params.get("currentUserId")!;
        this.createdByUserId = params.get("createdByUserId")!;

        this.state = {
            skillList: [],
            documentUrlList: [],
            projectDetails: {
                projectId: "",
                status: 0,
                title: "",
                description: "",
                supportDocuments: "",
                requiredSkills: "",
                createdDate: new Date(),
                createdByName: "",
                createdByUserId: "",
                updatedDate: new Date(),
                teamSize: 0,
                isRemoved: false,
                projectStartDate: "",
                projectEndDate: "",
                isJoinedByUser: false,
                isCurrentUserProject: false,
                avatarBackgroundColor: "",
                projectParticipantsUserMapping: "",
                projectParticipantsUserIds: "",
            },
            isEditDialogOpen: false,
            isLoading: true,
            showLoader: false,
            theme:""
        }
    }

    /** 
     *  Called once component is mounted. 
    */
    async componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.upn = context.upn!;
            this.setState({ theme: context.theme! });
        });
        let response = await getProjectDetailToJoin(this.projectId, this.createdByUserId);

        if (response.status === 200 && response.data) {
            this.setState({
                projectDetails: response.data
            });
        }

        this.setState({
            skillList: this.state.projectDetails.requiredSkills.split(";"),
            documentUrlList: this.state.projectDetails.supportDocuments.split(";")
        })

        this.setState({
            isLoading: false
        });
    }

	/**
	*Close the dialog and pass back card properties to parent component.
	*/
    onSubmitClick = async () => {
        this.setState({
            showLoader: true
        });

        let projectDetails = this.state.projectDetails;
        let toBot =
        {
            projectDetails,
            command: Resources.submitJoinProjectTaskModule,
            upn: this.upn
        };

        microsoftTeams.tasks.submitTask(toBot);
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

        let membersJoined = 0;
        if (this.state.projectDetails.projectParticipantsUserIds !== "") {
            membersJoined = this.state.projectDetails.projectParticipantsUserIds.split(';').length
        }

        let startDate = moment.utc(this.state.projectDetails.projectStartDate).local().format("MM-DD-YYYY hh:mm A");
        let endDate = moment.utc(this.state.projectDetails.projectEndDate).local().format("MM-DD-YYYY hh:mm A");

        if (this.state.isLoading === false) {
            return (
                <Provider className="join-project-dialog-provider-wrapper-taskview">
                    <Flex styles={{height:"45rem"}}>
                        <div className="join-project-dialog-body-taskview">
                            <Flex gap="gap.smaller" className="input-label-space-between-taskview" styles={{ fontSize: "12px" }}>
                                <Flex.Item>
                                    <Text styles={{ fontSize:"18px" }} className="project-title-taskview" content={this.state.projectDetails.title} />
                                </Flex.Item>
                            </Flex>
                            <div style={{fontSize:"12px"}}>
                                <Flex gap="gap.smaller" className="label-spacing-taskview joined-project-text-area-taskview input-label-space-between-taskview">
                                    <Flex.Item>
                                        <Text className="joined-project-text-area-taskview" content={this.state.projectDetails.description} />
                                    </Flex.Item>
                                </Flex>
                                <Flex gap="gap.small">
                                    <div className="joined-project-half-field-taskview label-spacing-taskview">
                                        <Flex gap="gap.smaller" className="input-label-space-between-taskview edit-team-size-space">
                                            <Flex.Item>
                                                <Text content={this.localize("projectDurationLabel") + " :"} />
                                            </Flex.Item>
                                        </Flex>
                                    </div>
                                    <div className="joined-project-half-field-taskview label-spacing-taskview bold-value content-width">
                                        <Flex gap="gap.smaller" className="input-label-space-between-taskview edit-team-size-space">
                                            <Flex.Item>
                                                <Text weight="semibold" content={startDate + " - " + endDate} />
                                            </Flex.Item>
                                        </Flex>
                                    </div>
                                </Flex>
                                <Flex gap="gap.small">
                                    <div className="joined-project-half-field-taskview label-spacing-taskview">
                                        <Flex gap="gap.smaller" className="input-label-space-between-taskview">
                                            <Flex.Item>
                                                <Text content={this.localize("teamSize") + " :"} />
                                            </Flex.Item>
                                        </Flex>
                                    </div>
                                    <div className="joined-project-half-field-taskview label-spacing-taskview left-spacing-teamsize-taskview bold-value">
                                        <Flex gap="gap.smaller" className="input-label-space-between-taskview">
                                            <Flex.Item>
                                                <Text weight="semibold" content={this.state.projectDetails.teamSize} />
                                            </Flex.Item>
                                        </Flex>
                                    </div>
                                </Flex>
                                <Flex gap="gap.small">
                                    <div className="joined-project-half-field-taskview label-spacing-taskview ">
                                        <Flex gap="gap.smaller" className="input-label-space-between-taskview">
                                            <Flex.Item>
                                                <Text content={this.localize("membersJoinedLabel") + " :"} />
                                            </Flex.Item>
                                        </Flex>
                                    </div>
                                    <div className="joined-project-half-field-taskview label-spacing-taskview left-spacing-joined-taskview bold-value">
                                        <Flex gap="gap.smaller" className="input-label-space-between-taskview">
                                            <Flex.Item>
                                                <Text weight="semibold" content={membersJoined} />
                                            </Flex.Item>
                                        </Flex>
                                    </div>
                                </Flex>
                                <Flex gap="gap.smaller" vAlign="center" className="label-spacing-taskview input-label-space-between-taskview">
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
                                <Flex gap="gap.smaller" className="label-spacing-taskview input-fields-margin-between-add-post-taskview">
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
                            !this.state.projectDetails.projectParticipantsUserIds.split(';').includes(this.currentUserId) &&
                            this.state.projectDetails.createdByUserId !== this.currentUserId &&
                            this.state.projectDetails.projectParticipantsUserIds.split(';').filter((userId) => userId).length < this.state.projectDetails.teamSize
                            ? <Flex className="join-project-dialog-footer-wrapper-taskview">
                                <Flex gap="gap.smaller" className="join-project-dialog-footer-taskview input-fields-margin-between-add-post-taskview">
                                    <Flex.Item push>
                                        <Button content={this.localize("joinButtonText")} primary loading={this.state.showLoader} disabled={this.state.showLoader} onClick={this.onSubmitClick} />
                                    </Flex.Item>
                                </Flex>
                            </Flex>
                            :
                            <></>
                    }
                </Provider>
            );
        }
        else {
            return (<></>)
        }
    }
}

export default withTranslation()(JoinProjectDialogContent)