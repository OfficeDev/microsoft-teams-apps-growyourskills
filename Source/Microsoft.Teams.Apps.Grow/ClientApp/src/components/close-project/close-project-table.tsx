// <copyright file="close-project-table.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Input, Text, TextArea, Table, Avatar, Flex, Accordion, List, Label, CloseIcon } from "@fluentui/react-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import { ICloseProjectMemberDetails } from './close-project-wrapper';
import { IProjectDetails } from "../card-view/discover-wrapper-page"
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import Resources from "../../constants/resources";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../styles/close-project.css";

interface ICloseProjectTableProps extends WithTranslation {
    errorMessage: string;
    errorIndex: number;
    showSkillCountError: boolean;
    emptySkillsCheck: Array<number>;
    projectMemberDetails: Array<ICloseProjectMemberDetails>;
    memberDetails: IProjectDetails;
    onSkillKeyDown: (event: number, index: number) => void;
    onSkillChange: (skill: string, index: number) => void;
    skillChangeIndex: number;
    onSkillRemoveClick: (index: number, projectMemberIndex: number) => void;
    inputValue: string;
    onDescriptionChange: (description: string, index: number) => void;
    screenWidth: number
}

interface ICloseProjectTableState {
    theme: string
}

class CloseProjectTable extends React.Component<ICloseProjectTableProps, ICloseProjectTableState> {

    localize: TFunction;
    constructor(props: any) {
        super(props);
        this.localize = this.props.t;


        this.state = {
            theme:""
        }
    }

    /**
    * Used to initialize Microsoft Teams sdk
    */
    async componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.setState({ theme: context.theme! })
        });
    }

    /**
* get initial of user names to show in avatar.
*/
    getInitials = (userPostName: string) => {
        let fullName = userPostName;
        let names = fullName.split(' '),
            initials = names[0].substring(0, 1).toUpperCase();

        if (names.length > 1) {
            initials += names[names.length - 1].substring(0, 1).toUpperCase();
        }
        return initials;
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        const privateListTableHeader = {
            key: "header",
            items: [
                { content: <Text weight="regular" content={this.localize("headerName")} />, key: "heading" },
                { content: <Text weight="regular" content={this.localize("skillsHeader")} />, key: "description" },
                { content: <Text weight="regular" content={this.localize("headerFeedback")} />, key: "user", className: "table-user-cell" },
            ],
        };

        let privateListTableRows = this.props.projectMemberDetails.map((teamMember: ICloseProjectMemberDetails, index: number) => (
            {
                key: index,
                items: [
                    {
                        content:
                            <><Avatar name={teamMember.name} /> <Text
                                key={index}
                                content={teamMember.name}
                                title={teamMember.name}
                                className="project-endorsee"
                            /></>, truncateContent: true
                    },
                    {
                        content:
                            <>
                                <Flex key={index} gap="gap.smaller" vAlign="start">
                                    <Text className="error-text" key={index} content={teamMember.error} />
                                </Flex>
                                <Input maxLength={Resources.closeProjectAcquiredSkillsMaxLength}
                                    value={this.props.skillChangeIndex === index ? this.props.inputValue : ""}
                                    onKeyDown={(event: any) => this.props.onSkillKeyDown(event.keyCode, index)}
                                    onChange={(event: any) => this.props.onSkillChange(event.target.value, index)}
                                    className="skills-input"
                                    placeholder={this.localize("skillsClosurePlaceHolder")} />

                                <div className="skills-container">
                                    {
                                        teamMember.skillsList.map((value: string, skillIndex) => {
                                            if (value.trim().length > 0) {
                                                return <Label
                                                    styles={{ paddingBottom: "1rem" }}
                                                    circular
                                                    content={<Text content={value.trim()} title={value.trim()} size="small" />}
                                                    className={this.state.theme === Resources.dark ? "tags-label-wrapper-dark" : "tags-label-wrapper"}
                                                    icon={<CloseIcon styles={{ marginBottom:"-0.5rem" }} key={skillIndex}
                                                        onClick={()=>this.props.onSkillRemoveClick(skillIndex, index)} />}
                                                />;
                                            }
                                        })
                                    }
                                </div>
                            </>
                    },
                    {
                        content: <TextArea maxLength={Resources.closeProjectFeedBackMaxLength} onChange={(event: any) => this.props.onDescriptionChange(event.target.value, index)} className="description-textarea" placeholder={this.localize("messagePlaceHolder")}/>, truncateContent: true
                    }
                ],
            }
        ));

        let privateListDataRowsListView = this.props.projectMemberDetails.map((teamMember: ICloseProjectMemberDetails, index: number) => (
            {
                key: teamMember.userId,
                userId: teamMember.userId,
                header: <></>,
                content:
                    <>
                        <div>
                            <Text weight="regular" content={this.localize("skillsHeader")} />
                        </div>
                        <Flex key={index} gap="gap.smaller" vAlign="start">
                            <Text className="error-text" key={index} content={teamMember.error} />
                        </Flex>
                        <Flex gap="gap.large">
                            <Input maxLength={Resources.closeProjectAcquiredSkillsMaxLength}
                                fluid
                                value={this.props.skillChangeIndex === index ? this.props.inputValue : ""}
                                onKeyDown={(event: any) => this.props.onSkillKeyDown(event.keyCode, index)}
                                onChange={(event: any) => this.props.onSkillChange(event.target.value, index)}
                                className="skills-input"
                                placeholder="Please enter skills" />
                        </Flex>

                        <div className="skills-container">
                            {
                                teamMember.skillsList.map((value: string, skillIndex) => {
                                    if (value.trim().length > 0) {
                                        return <Label
                                            styles={{ paddingBottom: "1rem" }}
                                            circular
                                            content={<Text content={value.trim()} title={value.trim()} size="small" />}
                                            className={this.state.theme === Resources.dark ? "tags-label-wrapper-dark" : "tags-label-wrapper"}
                                            icon={<CloseIcon styles={{ marginBottom: "-0.5rem" }} key={skillIndex}
                                                onClick={() => this.props.onSkillRemoveClick(skillIndex, index)} />}
                                        />;
                                    }
                                })
                            }
                        </div>

                        <Flex gap="gap.large" vAlign="center">
                            <Text weight="regular" content={this.localize("headerFeedback")} />
                        </Flex>

                        <Flex>
                            <TextArea maxLength={Resources.closeProjectFeedBackMaxLength} onChange={(event: any) => this.props.onDescriptionChange(event.target.value, index)} className="description-textarea" placeholder="Describe in less than 200 words" />
                        </Flex>
                    </>
            }
        ));

        let panelsForListItem = this.props.projectMemberDetails.map((memberDetail: ICloseProjectMemberDetails) => (
            {
                title: <Text content={memberDetail.name} />,
                content: <List items={privateListDataRowsListView.filter(row => row.userId === memberDetail.userId)} />
            }
        ));

        return (
            <>
                {this.props.memberDetails.projectParticipantsUserIds
                    ? this.props.screenWidth > 750 && <Table
                        variables={{ cellContentOverflow: 'wrap' }}
                        rows={privateListTableRows}
                        header={privateListTableHeader}
                        className="nonmobile-endorse-skill-list table-cell-content" />
                    : this.props.screenWidth > 750 && <Flex className="no-participant-joined"><Text content={this.localize("noParticpantJoinedProject")} /></Flex>
                }

                {this.props.screenWidth <= 750 && <Accordion defaultActiveIndex={[0]} panels={panelsForListItem} className="list-view-container" />}
            </>
        );
    }

}
export default withTranslation()(CloseProjectTable)