// <copyright file="skills-acquired-wrapper.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Loader } from "@fluentui/react-northstar";
import SkillsAcquiredTable from "./skills-aquired-table";
import { getUserAcquiredSkills } from "../../api/acquired-skills-api";
import NoPrivatePost from '../card-view/filter-no-post-content-page';
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";

import 'bootstrap/dist/css/bootstrap.min.css';
import "../../styles/close-project.css";

export interface IProjectSkillsAcquiredDetails {
    projectTitle: string;
    projectOwnerName: string;
    projectClosedDate: Date;
    acquiredSkills: string;
}

interface ISkillsAcquiredState {
    isLoading: boolean;
    screenWidth: number;
    projectSkillsDetails: Array<IProjectSkillsAcquiredDetails>
}

class SkillsAcquiredWrapperPage extends React.Component<WithTranslation, ISkillsAcquiredState> {
    localize: TFunction;

    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
        window.addEventListener("resize", this.update);
        this.state = {
            isLoading: true,
            screenWidth: 0,
            projectSkillsDetails:[]
        }
    }

    /**
    * Used to initialize Microsoft Teams sdk
    */
    async componentDidMount() {
        this.setState({ isLoading: true });
        this.getProjectSkillsAcquired();
        this.update();
    }

    /**
    * get screen width real time
    */
    update = () => {
        this.setState({
            screenWidth: window.innerWidth
        });
    };

    /**
    * Fetch projects for user private list tab from API
    */
    getProjectSkillsAcquired = async () => {
        let response = await getUserAcquiredSkills();
        if (response.status === 200 && response.data) {
            this.setState({
                projectSkillsDetails: response.data
            });
        }
        this.setState({
            isLoading: false
        });
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        return (
            <div className="container-div">
                <div className="container-subdiv">
                    {this.getWrapperPage()}
                </div>
            </div>
        );
    }

    /**
    *Get wrapper for page which acts as container for all child components
    */
    private getWrapperPage = () => {
        if (this.state.isLoading) {
            return (
                <div className="container-div">
                    <div className="container-subdiv">
                        <div className="loader">
                            <Loader />
                        </div>
                    </div>
                </div>
            );
        } else {
            return this.state.projectSkillsDetails.length ?
                <SkillsAcquiredTable
                    screenWidth={this.state.screenWidth}
                    projectSkillsDetails={this.state.projectSkillsDetails}/>
                : <NoPrivatePost />
        }
    }
}

export default withTranslation()(SkillsAcquiredWrapperPage)