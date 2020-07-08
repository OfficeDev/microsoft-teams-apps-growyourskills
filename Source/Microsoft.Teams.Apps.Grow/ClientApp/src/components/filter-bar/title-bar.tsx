// <copyright file="title-bar.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import FilterBar from "./filter-bar";
import CommandBar from "./command-bar";
import { ICheckBoxItem } from "./filter-bar"
import { getProjectOwners, getSkills } from "../../api/discover-api";
import { IProjectDetails } from "../card-view/discover-wrapper-page";

interface IFilterBarProps {
    onTypeCheckboxStateChange: (currentValues: Array<ICheckBoxItem>) => void
    onSharedByCheckboxStateChange: (currentValues: Array<ICheckBoxItem>) => void
    onSearchInputChange: (searchString: string) => void;
    onSortByChange: (selectedValue: string) => void;
    onNewPostSubmit: (isSuccess: boolean, getSubmittedPost: IProjectDetails) => void;
    onFilterSearchChange: (searchText: string) => void;
    onSkillsStateChange: (currentValues: Array<ICheckBoxItem>) => void;
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
    constructor(props: IFilterBarProps) {
        super(props);

        this.state = {
            isOpen: false,
            sharedByAuthorList: [],
            skillsList: [],
            showSolidFilter: false
        }
    }

    componentDidMount() {
        this.getAuthors();
        this.getSkills();
    }

    componentWillReceiveProps(nextProps: IFilterBarProps) {
        if (nextProps.hideFilterbar !== this.props.hideFilterbar) {
            if (nextProps.hideFilterbar === true) {
                this.setState({ isOpen: false });
                this.getAuthors();
                this.getSkills();
            }
        }
    }

	/**
    * Fetch list of authors from API
    */
    getAuthors = async () => {
        let response = await getProjectOwners();
        if (response.status === 200 && response.data) {
            this.setState({
                sharedByAuthorList: response.data.map((author: string) => { return author.trim() })
            });
        }
    }

	/**
    * Fetch list of skills from API.
    */
    getSkills = async () => {
        let response = await getSkills();
        if (response.status === 200 && response.data) {
            this.setState({
                skillsList: response.data
            });
        }
    }

	/**
    * Sets state to show/hide filter bar
    */
    onOpenStateChange = () => {
        this.setState({ showSolidFilter: !this.state.showSolidFilter, isOpen: !this.state.isOpen });
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
                    onFilterButtonClick={this.onOpenStateChange}
                    onNewProjectSubmit={this.props.onNewPostSubmit}
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
                    onFilterBarCloseClick={this.onOpenStateChange}
                    onSharedByCheckboxStateChange={this.props.onSharedByCheckboxStateChange}
                    onTypeCheckboxStateChange={this.props.onTypeCheckboxStateChange}
                    onSkillsStateChange={this.props.onSkillsStateChange} />
            </>
        )
    }
}

export default TitleBar;