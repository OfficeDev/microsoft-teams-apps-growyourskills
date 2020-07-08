// <copyright file="close-project-wrapper.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { ItemLayout, Flex, Image, Text, CloseIcon, Button, Divider, InfoIcon } from "@fluentui/react-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import { closeProject } from "../../api/discover-api";
import { getBaseUrl } from '../../configVariables';
import { IProjectDetails } from "../card-view/discover-wrapper-page";
import CloseProjectTable from './close-project-table';
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../styles/close-project.css";

interface ICloseProjectProps extends WithTranslation {
    closeDialog: (isOpen: boolean) => void;
    onCloseProjectButtonClick: (isSuccess: boolean, projectId: string) => void;
    cardDetails: IProjectDetails;
}

export interface ICloseProjectMemberDetails {
    name: string;
    userId: string;
    skillsList: Array<string>;
    feedBack: string;
    acquiredSkills: string;
    error: string;
}

export interface ICloseProjectDetails {
    projectId: string;
    projectTitle: string;
    projectOwnerName: string;
    projectParticipantDetails: Array<ICloseProjectMemberDetails>
}

interface ICloseProjectState {
    projectParticipantDetails: Array<ICloseProjectMemberDetails>;
    closeProjectDetails: ICloseProjectDetails;
    skillText: string;
    showSkillCountError: boolean;
    errorIndex: number;
    errorMessage: string;
    showLoader: boolean;
    emptySkillsCheck: Array<number>;
    skillChangeIndex: number;
    showSkillRequiredError: boolean;
    screenWidth: number;
}

class CloseProjectWrapper extends React.Component<ICloseProjectProps, ICloseProjectState> {

    localize: TFunction;
    imageUrl = getBaseUrl() + "/Artifact/applicationLogo.png";
    constructor(props: any) {
        super(props);
        this.localize = this.props.t;

        this.state = {
            projectParticipantDetails: [],
            skillText: "",
            showSkillCountError: false,
            errorIndex: 0,
            errorMessage: "",
            emptySkillsCheck: [],
            showLoader: false,
            skillChangeIndex: 0,
            showSkillRequiredError: false,
            closeProjectDetails: {
                projectId: "",
                projectParticipantDetails: [],
                projectTitle: this.props.cardDetails.title,
                projectOwnerName: this.props.cardDetails.createdByName
            },
            screenWidth: 0
        }
    }

    /**
    * Used to initialize Microsoft Teams sdk
    */
    async componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            window.addEventListener("resize", this.update.bind(this));
            this.update();
        });
        let memberDetails = this.props.cardDetails.projectParticipantsUserMapping.split(';');
        let closeProjectDetails = this.state.projectParticipantDetails;
        memberDetails.map((member) => {
            let details = {
                name: member.split(':')[1],
                userId: member.split(':')[0],
                skillsList: [],
                feedBack: "",
                acquiredSkills: "",
                error:""
            }
            closeProjectDetails.push(details);
        });
        this.setState({
            projectParticipantDetails: closeProjectDetails
        });
    }

    /**
    * get screen width real time
    */
    update = () => {
        if (window.innerWidth !== this.state.screenWidth) {
            this.setState({ screenWidth: window.innerWidth });
        }
    };

    onCloseProjectButtonClick = async () => {
        this.setState({
            showLoader: true
        });
        let closeProjectDetails = this.state.closeProjectDetails;
        closeProjectDetails.projectId = this.props.cardDetails.projectId;
        closeProjectDetails.projectParticipantDetails = this.state.projectParticipantDetails;
        if (this.checkIfCloseAllowed()) {
            let response = await closeProject(closeProjectDetails);
            if (response.status === 200 && response.data) {
                this.props.onCloseProjectButtonClick(true, this.props.cardDetails.projectId);
                this.props.closeDialog(false);

            }
            else {
                this.props.onCloseProjectButtonClick(false, this.props.cardDetails.projectId);
                this.props.closeDialog(false);
            }
        }
        this.setState({
            showLoader: false
        });
    }

    checkIfCloseAllowed = () => {
        let emptySkillsCheck = this.state.emptySkillsCheck;
        let closeProjectDetails = this.state.closeProjectDetails;
        closeProjectDetails.projectParticipantDetails.map((memberFeedback, index) => {
            if (memberFeedback.acquiredSkills === "" && this.state.showSkillRequiredError === false) {
                emptySkillsCheck.push(index);
                this.setState({
                    emptySkillsCheck: emptySkillsCheck,
                    errorMessage: this.localize("closeSkillsRequired"),
                    showSkillRequiredError: true
                })
            }
        })
        if (this.state.emptySkillsCheck.length > 0) {
            return false
        }
        else {
            return true
        }

    }

    onSkillChange = (skillText: string, index: number) => {

        this.setState({
            skillText: skillText.toLowerCase(),
            skillChangeIndex: index
        })
    }

    onSkillKeyDown = (keyCode: number, index: number) => {
        if (keyCode === 13) {
            let projectMemberDetails = this.state.projectParticipantDetails;
            projectMemberDetails.map((teamMember: ICloseProjectMemberDetails, teamIndex: number) => {
                if (index === teamIndex) {
                    if (teamMember.skillsList.indexOf(this.state.skillText) === -1 && teamMember.skillsList.length < 3 && this.state.skillText.length > 0) {
                        teamMember.skillsList.push(this.state.skillText);
                        teamMember.error = "";
                        this.setState({
                            showSkillCountError: false,
                            emptySkillsCheck: [],
                            skillText: "",
                            showSkillRequiredError: false
                        })
                    }
                    else {
                        if (teamMember.skillsList.length + 1 > 3) {
                            teamMember.error = this.localize("maxSkillsAllowedClose");
                            return;
                        }
                        if (teamMember.skillsList.indexOf(this.state.skillText) !== -1) {
                            teamMember.error = this.localize("closeSkillsAlreadyExist");
                            return;
                        }
                        if (teamMember.skillsList.length <= 3) {
                            teamMember.error = "";
                        }
                    }
                }
                else {
                    teamMember.error = "";
                }
                teamMember.acquiredSkills = teamMember.skillsList.join(';');
            });
            this.setState({
                projectParticipantDetails: projectMemberDetails,
                skillText: ""
            })
        }
    }

    onSkillsRemoveClick = (index: number, projectMemberIndex: number) => {
        let projectMemberDetails = this.state.projectParticipantDetails;
        projectMemberDetails[projectMemberIndex].skillsList.splice(index, 1);
        projectMemberDetails[projectMemberIndex].acquiredSkills = projectMemberDetails[projectMemberIndex].skillsList.join(';');
        this.setState({
            projectParticipantDetails: projectMemberDetails,
            showSkillCountError: false
        });
        this.onSkillKeyDown(13, projectMemberIndex);
    }

    onDescriptionChange = (description: string, index: number) => {
        let projectMemberDetails = this.state.projectParticipantDetails;
        projectMemberDetails[index].feedBack = description;
        this.setState({
            projectParticipantDetails: projectMemberDetails
        })
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        return (
            <div className="close-project-container">
                <Flex>
                    <Flex.Item grow>
                        <ItemLayout
                            className="app-name-container"
                            media={<Image className="app-logo-container" src="/Artifacts/applicationLogo.png" />}
                            header={<Text content={this.localize("dialogTitleAppName")} weight="bold" />}
                            content={<Text className="app-dialog-heading" content={this.localize("projectClosureHeading")} weight="semibold" size="small" />}
                        />
                    </Flex.Item>
                    <CloseIcon onClick={() => this.props.closeDialog(false)} className="icon-hover" />
                </Flex>
                <Flex>
                    <div className="dialog-body">
                        {
                            this.props.cardDetails.projectParticipantsUserIds &&
                            <>
                                {this.state.screenWidth < 750 && <div className="divider-for-small-device"> <Divider /> </div>}
                                <Text content={this.localize("projectClosureCongrats")} weight="bold" size="large" /><br/>
                                <Text content={this.localize("projectCloseSubHeading")} weight="semibold" /><br />
                                {this.state.screenWidth < 750 && <div className="divider-for-small-device"> <Divider /> </div>}
                            </>
                        }
                        {this.state.screenWidth > 750 && this.props.cardDetails.projectParticipantsUserIds &&
                            <Flex gap="gap.smaller" className="skills-flex skills-new-project input-fields-margin-between-add-post" vAlign="center">
                                <Text content={this.localize("requiredSkillsLabel")} />
                                <Text content={this.props.cardDetails.requiredSkills.trim().split(';').join(', ')} />
                            </Flex>
                        }
                        <div className="input-fields-margin-between-add-post">
                            <CloseProjectTable
                                skillChangeIndex={this.state.skillChangeIndex}
                                errorMessage={this.state.errorMessage}
                                errorIndex={this.state.errorIndex}
                                showSkillCountError={this.state.showSkillCountError}
                                projectMemberDetails={this.state.projectParticipantDetails}
                                memberDetails={this.props.cardDetails}
                                onSkillKeyDown={this.onSkillKeyDown}
                                onSkillChange={this.onSkillChange}
                                onSkillRemoveClick={this.onSkillsRemoveClick}
                                inputValue={this.state.skillText}
                                emptySkillsCheck={this.state.emptySkillsCheck}
                                onDescriptionChange={this.onDescriptionChange}
                                screenWidth={this.state.screenWidth} />
                        </div>
                    </div>
                </Flex>
                {
                    this.props.cardDetails.projectParticipantsUserIds &&
                    <Flex className="dialog-footer-wrapper">
                        <Flex gap="gap.smaller" className="dialog-footer input-fields-margin-between-add-post" vAlign="center">
                            <><InfoIcon outline /><Text styles={{ fontSize: "12px"}} content={this.localize("closeProjectDialogNote")} /></>
                            <Flex.Item push>
                                <div></div>
                            </Flex.Item>
                            <Button styles={{marginRight:"0.5rem"}} disabled={this.state.projectParticipantDetails.filter((participant) => participant.acquiredSkills.split(';')[0] !== "").length !== this.state.projectParticipantDetails.length} content={this.localize("closeButton")} onClick={this.onCloseProjectButtonClick} loading={this.state.showLoader} primary />
                        </Flex>
                    </Flex>
                }
            </div>
        );
    }

}
export default withTranslation()(CloseProjectWrapper)