// <copyright file="title-bar-teams.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import FilterBar from "../filter-bar/filter-bar";
import CommandBar from "../filter-bar/command-bar";
import { getTeamAuthors } from "../../api/discover-api";
import { getConfigSkills } from "../../api/teams-config-tab-api";
import { ICheckBoxItem } from "../filter-bar/filter-bar";
import { IProjectDetails } from "../card-view/discover-wrapper-page";

interface IFilterBarProps {
    onTypeCheckboxStateChange: (currentValues: Array<ICheckBoxItem>) => void
    onSharedByCheckboxStateChange: (currentValues: Array<ICheckBoxItem>) => void
    onSearchInputChange: (searchString: string) => void;
    onSortByChange: (selectedValue: string) => void;
    onNewProjectSubmit: (isSuccess: boolean, getSubmittedPost: IProjectDetails) => void;
    onFilterSearchChange: (searchText: string) => void;
    onSkilsStateChange: (currentValues: Array<ICheckBoxItem>) => void;
    searchFilterProjectsUsingAPI: () => void;
    onFilterClear: (isFilterOpened: boolean) => void;
    commandBarSearchText: string;
    hideFilterbar: boolean;
    showFilter: boolean;
    teamId: string;
    projectDetails: Array<IProjectDetails>;
}

interface IFilterBarState {
    isOpen: boolean;
    sharedByAuthorList: Array<string>;
    skillsList: Array<string>;
    showSolidFilter: boolean;
}

class TitleBar extends React.Component<IFilterBarProps, IFilterBarState> {
    teamId: string;

    constructor(props: IFilterBarProps) {
        super(props);
        this.teamId = "";
        this.state = {
            isOpen: false,
            sharedByAuthorList: [],
            skillsList: [],
            showSolidFilter: false
        }
    }

    componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.teamId = context.teamId!;
            this.getTeamSkills();
            this.getTeamAuthors();
        });
    }

    /**
    * Fetch list of authors from API
    */
    getTeamAuthors = async () => {
        let response = await getTeamAuthors(this.teamId);
        if (response.status === 200 && response.data) {
            this.setState({
                sharedByAuthorList: response.data.map((author: string) => { return author.trim() })
            });
        }
    }

	/**
    * Fetch list of skills from API
    */
    getTeamSkills = async () => {
        let response = await getConfigSkills(this.teamId);
        if (response.status === 200 && response.data) {
            this.setState({
                skillsList: response.data.skills.split(';')
            });
        }
    }


    componentWillReceiveProps(nextProps: IFilterBarProps) {
        if (nextProps.hideFilterbar !== this.props.hideFilterbar) {
            if (nextProps.hideFilterbar === true) {
                this.setState({ isOpen: false });
                this.getTeamSkills();
                this.getTeamAuthors();
            }
        }
    }

    changeOpenState = () => {
        this.setState({ showSolidFilter: !this.state.showSolidFilter });
        this.setState({ isOpen: !this.state.isOpen });
        this.props.onFilterClear(!this.state.isOpen);
    }

	/**
	* Renders the component
	*/
    public render(): JSX.Element {
        return (
            <>
                <CommandBar
                    teamId={this.props.teamId}
                    projectDetails={this.props.projectDetails}
                    showFilter={this.props.showFilter}
                    onFilterButtonClick={this.changeOpenState}
                    onNewProjectSubmit={this.props.onNewProjectSubmit}
                    onSearchInputChange={this.props.onSearchInputChange}
                    showSolidFilterIcon={this.state.showSolidFilter}
                    searchFilterProjectsUsingAPI={this.props.searchFilterProjectsUsingAPI}
                    commandBarSearchText={this.props.commandBarSearchText}
                />

                <FilterBar
                    skillsList={this.state.skillsList}
                    onFilterSearchChange={this.props.onFilterSearchChange}
                    onSortByStateChange={this.props.onSortByChange}
                    sharedByAuthorList={this.state.sharedByAuthorList}
                    isVisible={this.state.isOpen}
                    onFilterBarCloseClick={this.changeOpenState}
                    onSharedByCheckboxStateChange={this.props.onSharedByCheckboxStateChange}
                    onTypeCheckboxStateChange={this.props.onTypeCheckboxStateChange}
                    onSkillsStateChange={this.props.onSkilsStateChange} />
            </>
        )
    }
}

export default TitleBar;