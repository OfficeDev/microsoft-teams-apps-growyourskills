// <copyright file="skills-acquired-table.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Text, Flex, Table, Avatar, Label, List } from "@fluentui/react-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import { IProjectSkillsAcquiredDetails } from './skills-aquired-wrapper';
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import Resources from "../../constants/resources";
import { generateColor, getInitials } from "../../helpers/helper";

import 'bootstrap/dist/css/bootstrap.min.css';
import "../../styles/private-list.css";

var moment = require('moment');

interface IAquiredSkillsTableProps extends WithTranslation {
    screenWidth: number,
    projectSkillsDetails: Array<IProjectSkillsAcquiredDetails>
}

class AcquiredSkillsTable extends React.Component<IAquiredSkillsTableProps> {
    localize: TFunction;
    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
    }

    /**
    * Used to initialize Microsoft Teams sdk
    */
    async componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {

        });
    }

    removeSkills = () => {
        console.log("table");
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        const skillsAcquiredTableHeader = {
            key: "header",
            items: [
                { content: <Text weight="regular" content="Skills acquired" />, key: "skills", className:"table-header-padding" },
                { content: <Text weight="regular" content="Project" />, key: "title" },
                { content: <Text weight="regular" content="Endorsed by" />, key: "user", className: "username-date-column" },
                { content: <Text weight="regular" content="Endorsed on" />, key: "date", className: "username-date-column" },
            ]
        };

        let skillsAcquiredTableRows = this.props.projectSkillsDetails.map((project: IProjectSkillsAcquiredDetails, index: number) => (
            {
                key: index,
                items: [

                    {
                        content:
                            <Flex gap="gap.smaller" className="skills-flex" vAlign="center">
                                {
                                    project.acquiredSkills.split(";").map((value: string, index: number) => {
                                        if (value.trim().length) {
                                            if (this.props.screenWidth <= Resources.screenWidthLarge && this.props.screenWidth > Resources.screenWidthSmall) {
                                                if (index <= 1) {
                                                    return <Label
                                                            styles={{ paddingBottom: "1rem" }}
                                                            circular
                                                            content={<Text content={value.trim()} title={value.trim()} size="small" />}
                                                            className="skills-label-wrapper"
                                                        />
                                                }
                                                else {
                                                    return (
                                                        <Label
                                                            key={index}
                                                            circular
                                                            content="+1"
                                                            title={value.trim()}
                                                            className="skills-label-wrapper"
                                                        />
                                                    )
                                                }
                                            }
                                            else if (this.props.screenWidth <= Resources.screenWidthSmall) {

                                                if (index <= 0) {
                                                    return <Label
                                                        styles={{ paddingBottom: "1rem" }}
                                                        circular
                                                        content={<Text content={value.trim()} title={value.trim()} size="small" />}
                                                        className="skills-label-wrapper"
                                                    />
                                                }
                                                else {
                                                    if (index === 1) {
                                                        let skills = project.acquiredSkills.substring(project.acquiredSkills.indexOf(";") + 1);
                                                        let commaSeperatedSkills = skills.replace(';', ',');
                                                        return (
                                                            <Label
                                                                styles={{ paddingBottom: "1rem" }}
                                                                circular
                                                                content={<Text content={commaSeperatedSkills.trim()} title={commaSeperatedSkills.trim()} size="small" />}
                                                                className="skills-label-wrapper"
                                                            />
                                                        )
                                                    }
                                                    else {
                                                        return (
                                                            <></>
                                                        )
                                                    }
                                                }
                                            }
                                            else {
                                                return <Label
                                                    styles={{ paddingBottom: "1rem" }}
                                                    circular
                                                    content={<Text content={value.trim()} title={value.trim()} size="small" />}
                                                    className="skills-label-wrapper"
                                                />
                                            }

                                        }
                                    })
                                }
                            </Flex>
                    },
                    { content: <Text weight="semibold" title={project.projectTitle} content={project.projectTitle} />, truncateContent: true },
                    {
                        content: <><Avatar className="avatar-container" name={project.projectOwnerName} /> <Text
                            key={index}
                            content={project.projectOwnerName}
                            title={project.projectOwnerName}
                            className="project-endorsee"
                        /></>, truncateContent: true, className: "username-date-column"
                    },
                    { content: <Text content={moment.utc(project.projectClosedDate).local().format("MM-DD-YYYY hh:mm A")} title={moment.utc(project.projectClosedDate).local().format("MM-DD-YYYY hh:mm A")} />, truncateContent: true, className: "username-date-column" }
                ],
            }
        ));

        let skillsAcquiredListViewItems = this.props.projectSkillsDetails.map((project: IProjectSkillsAcquiredDetails, index: number) => (
            {
                key: index,
                header: <></>,
                media: <div className="user-avatar-mobile" style={{ backgroundColor: generateColor() }}>
                    <Text content={getInitials(project.projectOwnerName)} styles={{ paddingTop: "2rem" }} title={project.projectOwnerName} />
                </div>,
                contentMedia: <></>,
                content:
                    <Flex vAlign="stretch">
                        <Flex.Item>
                            <Flex column gap="gap.small" vAlign="stretch">
                                <Flex>
                                    {
                                        project.acquiredSkills.split(";").map((value: string, index: number) => {
                                            if (value.trim().length) {
                                                return <Label
                                                    styles={{ marginRight:"1rem" }}
                                                    circular
                                                    content={<Text content={value} styles={{ padding: "0.8rem" }} title={value} size="small" />}
                                                />;
                                            }
                                        })
                                    }
                                </Flex>
                                <Flex>
                                    <Text className="content-text-private-list" content={project.projectTitle} title={project.projectTitle} />
                                </Flex>
                            </Flex>
                        </Flex.Item>
                    </Flex>,
                className: "list-item"
            }
        ));

        return (
            <>
                {this.props.screenWidth <= 750 && <List items={skillsAcquiredListViewItems} />}
                {this.props.screenWidth > 750 && <Table rows={skillsAcquiredTableRows}
                    header={skillsAcquiredTableHeader} />}
            </>
        );
    }

}
export default withTranslation()(AcquiredSkillsTable)