// <copyright file="my-projects.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Menu } from "@fluentui/react-northstar";
import MyCreatedProjects from "../my-projects/my-created-projects";
import MyJoinedProjects from "../my-joined-projects/my-joined-projects";
import { getMyCreatedProjects, getMyJoinedProjects } from "../../api/discover-api";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";

import "../../styles/projects-cards.css";
import "../../styles/join-project-dialog.css";

interface IFilterBarState {
    activeIndex: number;
    joinedCount: number;
    createdCount: number;
}

class TitleBar extends React.Component<WithTranslation, IFilterBarState> {
    localize: TFunction;

    constructor(props: WithTranslation) {
        super(props);
        this.localize = this.props.t;
        this.state = {
            activeIndex: 0,
            joinedCount: 0,
            createdCount: 0
        }
    }

    componentDidMount() {
        this.getProjectCounts();
    }

    /**
  * Get filtered projects based on selected checkboxes.
  */
    getMyProjects = async () => {
        let response = await getMyCreatedProjects(0);
        if (response.status === 200 && response.data) {
            this.setState({
                createdCount: response.data.length,
            });
        }
    }

    getProjectCounts = () => {
        this.getMyProjects();
        this.getJoinedProjects();
    }

    /**
    * Fetch projects for Team tab from API
    */
    getJoinedProjects = async () => {
        let response = await getMyJoinedProjects(0);
        if (response.status === 200 && response.data) {
            this.setState({
                joinedCount: response.data.length
            })
        }
    }

    onMenuItemClick = (e: any, props: any) => {
        this.setState({
            activeIndex: props.activeIndex
        })
    }

	/**
	* Renders the component
	*/
    public render(): JSX.Element {

        let joinedCount = "";
        let createdCount = "";

        if (this.state.joinedCount > 0) {
            if (this.state.joinedCount === 50) {
                joinedCount = ' (50+)';
            }
            else {
                joinedCount = ' (' + this.state.joinedCount + ')';
            }            
        }
        else {
            joinedCount = " (0)";
        }

        if (this.state.createdCount > 0) {
            if (this.state.createdCount === 50) {
                createdCount = ' (50+)';
            }
            else {
                createdCount = ' (' + this.state.createdCount + ')';
            }
        }
        else {
            createdCount = " (0)";
        }

        const items = [
            {
                key: 'Created project',
                content: this.localize("projectsCreated") + createdCount,

            },

            {
                key: 'Joined projects',
                content: this.localize("projectsJoined") + joinedCount,
            }
        ]
        return (
            <>
                <div className="container-div">
                    <div className="container-subdiv-myprojects">
                        <Menu
                            defaultActiveIndex={0}
                            primary
                            items={items}
                            onActiveIndexChange={(e: any, props: any) => this.onMenuItemClick(e, props)}
                        />

                        {
                            this.state.activeIndex === 0
                                ? <MyCreatedProjects showProjectCount={this.getProjectCounts} />
                                : <MyJoinedProjects showProjectCount={this.getProjectCounts} />
                        }
                    </div>
                </div>
            </>
        )
    }
}

export default withTranslation()(TitleBar);