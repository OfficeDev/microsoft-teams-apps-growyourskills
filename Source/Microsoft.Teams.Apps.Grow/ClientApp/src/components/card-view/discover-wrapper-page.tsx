// <copyright file="discover-wrapper-page.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Loader } from "@fluentui/react-northstar";
import Card from "./card";
import NoPostAddedPage from "./no-post-added-page";
import FilterNoPostContentPage from "./filter-no-post-content-page";
import TitleBar from "../filter-bar/title-bar";
import { Container, Col, Row } from "react-bootstrap";
import * as microsoftTeams from "@microsoft/teams-js";
import { getAllProjects, getFilteredProjects, filterTitleAndSkills } from "../../api/discover-api";
import { generateColor } from "../../helpers/helper";
import NotificationMessage from "../notification-message/notification-message";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ICheckBoxItem } from "../filter-bar/filter-bar";
import Resources from "../../constants/resources";
import InfiniteScroll from 'react-infinite-scroller';

import 'bootstrap/dist/css/bootstrap.min.css';
import "../../styles/site.css";
import "../../styles/card.css";

export interface IProjectDetails {
    projectId: string;
    status: number;
    title: string;
    description: string;
    supportDocuments: string;
    requiredSkills: string;
    createdDate: Date;
    createdByName: string;
    createdByUserId: string;
    updatedDate: Date;
    teamSize: number;
    isRemoved: boolean;
    projectStartDate: string;
    projectEndDate: string;
    isJoinedByUser?: boolean;
    isCurrentUserProject?: boolean;
    avatarBackgroundColor: string;
    projectParticipantsUserMapping: string;
    projectParticipantsUserIds: string;
}

export interface IUserVote {
    projectId: string;
    userId: string;
}

interface ICardViewState {
    loader: boolean;
    resourceStrings: any;
    projectDetails: Array<IProjectDetails>;
    projectSearchDetails: Array<IProjectDetails>;
    alertMessage: string;
    alertprojectStatus: number;
    showAlert: boolean;
    searchText: string;
    showNoProjectPage: boolean;
    infiniteScrollParentKey: number;
    isFilterApplied: boolean;
    isPageInitialLoad: boolean;
    pageLoadStart: number;
    hasMoreProjects: boolean;
    initialProjects: Array<IProjectDetails>;
}

class DiscoverWrapperPage extends React.Component<WithTranslation, ICardViewState> {

    localize: TFunction;
    selectedSharedBy: Array<ICheckBoxItem>;
    selectedPostprojectStatus: Array<ICheckBoxItem>;
    selectedskills: Array<ICheckBoxItem>;
    selectedSortBy: string;
    filterSearchText: string;
    allProjects: Array<IProjectDetails>;
    loggedInUserObjectId: string;
    loggedInUserName: string;
    teamId: string;
    authorAvatarBackground: Array<any>;
    hasMoreProjects: boolean;

    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
        let colors = localStorage.getItem("avatar-colors");
        this.selectedSharedBy = [];
        this.selectedPostprojectStatus = [];
        this.selectedskills = [];
        this.selectedSortBy = "";
        this.filterSearchText = "";
        this.allProjects = [];
        this.loggedInUserObjectId = "";
        this.loggedInUserName = "";
        this.teamId = "";
        this.authorAvatarBackground = colors === null ? [] : JSON.parse(colors!);
        this.hasMoreProjects = true;

        this.state = {
            loader: true,
            projectDetails: [],
            projectSearchDetails: [],
            resourceStrings: {},
            alertMessage: "",
            alertprojectStatus: 0,
            showAlert: false,
            searchText: "",
            showNoProjectPage: false,
            isFilterApplied: false,
            infiniteScrollParentKey: 0,
            isPageInitialLoad: true,
            pageLoadStart: -1,
            hasMoreProjects: true,
            initialProjects: []
        }
    }

    /**
    * Used to initialize Microsoft Teams sdk
    */
    async componentDidMount() {
        this.initprojectDetails();
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.loggedInUserObjectId = context.userObjectId!;
            this.loggedInUserName = context.userPrincipalName!;
        });
    }

    /**
    * Fetch projects for initializing grid
    */
    initprojectDetails = async () => {
        let response = await getAllProjects(0);
        if (response.status === 200 && response.data) {
            this.setState({
                initialProjects: response.data,
                loader: false
            });
        }
    }

    /**
    * Get comma separated selected filter entities string.
    * @param filterEntity Array of selected filter entities.
    */
    private getFilterString(filterEntity: Array<string>) {
        return filterEntity.length > 1 ? filterEntity.join(";") : filterEntity.length === 1 ? filterEntity.join(";") + ";" : "";
    }

    /**
    * Get filtered projects based on selected checkboxes.
    * @param pageCount Page count for which next set of projects needs to be fetched
    */
    getFilteredprojectDetails = async (pageCount: number) => {
        let postprojectStatuss = this.selectedPostprojectStatus.map((postprojectStatus: ICheckBoxItem) => { return postprojectStatus.key.toString().trim() });
        let postprojectStatussString = encodeURI(this.getFilterString(postprojectStatuss));
        let authors = this.selectedSharedBy.map((authors: ICheckBoxItem) => { return authors.title.trim() });
        let authorsString = encodeURI(this.getFilterString(authors));
        let skills = this.selectedskills.map((skill: ICheckBoxItem) => { return skill.title.trim() });
        let skillsString = encodeURI(this.getFilterString(skills));

        let response = await getFilteredProjects(postprojectStatussString, authorsString, skillsString, pageCount);
        if (response.status === 200 && response.data) {
            if (response.data.length < 50) {
                this.hasMoreProjects = false;
            }
            else {
                this.hasMoreProjects = true;
            }

            response.data.map((post: IProjectDetails) => {
                let searchedAuthor = this.authorAvatarBackground.find((author) => author.id === post.createdByUserId);
                if (searchedAuthor) {
                    post.avatarBackgroundColor = searchedAuthor.color;
                }
                else {
                    let color = generateColor();
                    this.authorAvatarBackground.push({ id: post.createdByUserId, color: color });
                    post.avatarBackgroundColor = color;

                    localStorage.setItem("avatar-colors", JSON.stringify(this.authorAvatarBackground));
                }

                if (post.createdByUserId === this.loggedInUserObjectId) {
                    post.isCurrentUserProject = true;
                }
                else {
                    post.isCurrentUserProject = false;
                }

                this.allProjects.push(post);
            });

            if (response.data.count !== 0) {
                this.setState({
                    isPageInitialLoad: false,
                });
            }
            else {
                this.setState({
                    showNoProjectPage: true,
                    isPageInitialLoad: false
                })
            }
            //this.getUserVotes();
            this.onFilterSearchTextChange(this.filterSearchText);
        }
    }

    /**
    * Reset app user selected filters
    */
    resetAllFilters = () => {
        this.selectedSortBy = Resources.sortBy[0].id;
        this.selectedSharedBy = [];
        this.selectedPostprojectStatus = [];
        this.selectedskills = [];
        this.filterSearchText = "";
    }

    /**
    * Fetch projects for Team tab from API.
    * @param pageCount Page count for which next set of projects needs to be fetched.
    */
    getprojectDetails = async (pageCount: number) => {
        this.resetAllFilters();
        let response = await getAllProjects(pageCount);
        if (response.status === 200 && response.data) {
            if (response.data.length < 50) {
                this.hasMoreProjects = false;
            }
            else {
                this.hasMoreProjects = true;
            }
            response.data.map((post: IProjectDetails) => {
                let searchedAuthor = this.authorAvatarBackground.find((author) => author.id === post.createdByUserId);
                if (searchedAuthor) {
                    post.avatarBackgroundColor = searchedAuthor.color;
                }
                else {
                    let color = generateColor();
                    this.authorAvatarBackground.push({ id: post.createdByUserId, color: color });
                    post.avatarBackgroundColor = color;

                    localStorage.setItem("avatar-colors", JSON.stringify(this.authorAvatarBackground));
                }

                if (post.createdByUserId === this.loggedInUserObjectId) {
                    post.isCurrentUserProject = true;
                }
                else {
                    post.isCurrentUserProject = false;
                }

                this.allProjects.push(post);
            });

            if (response.data.count === 0) {
                this.setState({
                    showNoProjectPage: true
                })
            }
            //this.getUserVotes();
            this.onFilterSearchTextChange(this.filterSearchText);
        }

        this.setState({
            searchText: "",
            isPageInitialLoad: false
        });
    }

    /**
    *Sets state for showing alert notification.
    *@param content Notification message
    *@param projectStatus Boolean value indicating 1- Success 2- Error
    */
    showAlert = (content: string, projectStatus: number) => {
        this.setState({ alertMessage: content, alertprojectStatus: projectStatus, showAlert: true }, () => {
            setTimeout(() => {
                this.setState({ showAlert: false })
            }, 4000);
        });
    }

    /**
    *Sets state for hiding alert notification.
    */
    hideAlert = () => {
        this.setState({ showAlert: false })
    }

    /**
    *Removes selected blog post from page
    *@param projectId Id of post which needs to be deleted
    *@param isSuccess Boolean indication whether operation succeeded
    */
    handleDeleteButtonClick = (projectId: string, isSuccess: boolean) => {
        if (isSuccess) {
            this.allProjects.map((post: IProjectDetails) => {
                if (post.projectId === projectId) {
                    post.isRemoved = true;
                }
            });
            this.showAlert(this.localize("projectDeletedSuccess"), 1);
            this.onFilterSearchTextChange(this.filterSearchText);
        }
        else {
            this.showAlert(this.localize("postDeletedError"), 2);
        }
    }

    /**
    *Removes selected project from joined projects
    *@param projectId Id of project which needs to be deleted
    *@param isSuccess Boolean indication whether operation succeeded
    */
    handleLeaveButtonClick = (projectId: string, isSuccess: boolean) => {
        if (isSuccess) {
            this.allProjects.map((post: IProjectDetails) => {
                if (post.projectId === projectId) {
                    post.isRemoved = true;
                }
            });
            this.showAlert(this.localize("leaveProjectSuccess"), 1);
            this.onFilterSearchTextChange(this.filterSearchText);
        }
        else {
            this.showAlert(this.localize("leaveProjectError"), 2);
        }
    }

    /**
    *Invoked by Infinite scroll component when user scrolls down to fetch next set of projects.
    *@param pageCount Page count for which next set of projects needs to be fetched.
    */
    loadMoreProjects = (pageCount: number) => {
        if (!this.filterSearchText.trim().length) {
            if (this.state.searchText.trim().length) {
                this.searchFilterPostUsingAPI(pageCount);
            }
            else if (this.state.isFilterApplied) {
                this.getFilteredprojectDetails(pageCount);
            }
            else {
                this.getprojectDetails(pageCount);
            }
        }
    }

    /**
    *Set state of search text as per user input change
    *@param searchText Search text entered by user
    */
    handleSearchInputChange = async (searchText: string) => {
        this.setState({
            searchText: searchText
        });

        if (searchText.length === 0) {
            this.setState({
                isPageInitialLoad: true,
                pageLoadStart: -1,
                infiniteScrollParentKey: this.state.infiniteScrollParentKey + 1,
                projectDetails: [],
                hasMoreProjects: true
            });
            this.allProjects = [];
        }
    }

    /**
    *Filter cards based on user input after clicking search icon in search bar.
    */
    searchFilterPostUsingAPI = async (pageCount: number) => {
        this.resetAllFilters();
        if (this.state.searchText.trim().length) {
            let response = await filterTitleAndSkills(this.state.searchText, pageCount);

            if (response.status === 200 && response.data) {
                if (response.data.length < 50) {
                    this.hasMoreProjects = false;
                }
                else {
                    this.hasMoreProjects = true;
                }

                response.data.map((post: IProjectDetails) => {
                    let searchedAuthor = this.authorAvatarBackground.find((author) => author.id === post.createdByUserId);
                    if (searchedAuthor) {
                        post.avatarBackgroundColor = searchedAuthor.color;
                    }
                    else {
                        let color = generateColor();
                        this.authorAvatarBackground.push({ id: post.createdByUserId, color: color });
                        post.avatarBackgroundColor = color;

                        localStorage.setItem("avatar-colors", JSON.stringify(this.authorAvatarBackground));
                    }

                    if (post.createdByUserId === this.loggedInUserObjectId) {
                        post.isCurrentUserProject = true;
                    }
                    else {
                        post.isCurrentUserProject = false;
                    }

                    this.allProjects.push(post)
                });

                this.setState({ isPageInitialLoad: false });
                //this.getUserVotes();
                this.onFilterSearchTextChange(this.filterSearchText);
            }
        }
    }


    /**
    *Filter cards based on 'shared by' checkbox selection.
    *@param selectedCheckboxes User selected checkbox array
    */
    onSharedByCheckboxStateChange = (selectedCheckboxes: Array<ICheckBoxItem>) => {
        this.selectedSharedBy = selectedCheckboxes.filter((value) => { return value.isChecked });
        this.setState({
            isPageInitialLoad: true,
            pageLoadStart: -1,
            infiniteScrollParentKey: this.state.infiniteScrollParentKey + 1,
            projectDetails: [],
            searchText: "",
            hasMoreProjects: true
        });

        this.allProjects = [];
    }

    /**
    *Filter cards based on post projectStatus checkbox selection.
    *@param selectedCheckboxes User selected checkbox array
    */
    onprojectStatusCheckboxStateChange = (selectedCheckboxes: Array<ICheckBoxItem>) => {
        this.selectedPostprojectStatus = selectedCheckboxes.filter((value) => { return value.isChecked });
        this.setState({
            isPageInitialLoad: true,
            pageLoadStart: -1,
            infiniteScrollParentKey: this.state.infiniteScrollParentKey + 1,
            projectDetails: [],
            searchText: "",
            hasMoreProjects: true
        });

        this.allProjects = [];
    }

    /**
    *Filter cards based on skills checkbox selection.
    *@param selectedCheckboxes User selected checkbox array
    */
    onskillsStateChange = (selectedCheckboxes: Array<ICheckBoxItem>) => {
        this.selectedskills = selectedCheckboxes.filter((value) => { return value.isChecked });
        this.setState({
            isPageInitialLoad: true,
            pageLoadStart: -1,
            infiniteScrollParentKey: this.state.infiniteScrollParentKey + 1,
            projectDetails: [],
            searchText: "",
            hasMoreProjects: true
        });

        this.allProjects = [];
    }

    /**
    *Filter cards based sort by value.
    *@param selectedValue Selected value for 'sort by'
    */
    onSortByChange = (selectedValue: string) => {
        this.selectedSortBy = selectedValue;
        this.setState({
            isPageInitialLoad: true,
            pageLoadStart: -1,
            infiniteScrollParentKey: this.state.infiniteScrollParentKey + 1,
            projectDetails: [],
            searchText: "",
            hasMoreProjects: true
        });

        this.allProjects = [];
    }

    /**
    * Invoked when post is edited. Updates state and shows notification alert.
    * @param cardDetails Updated post details
    * @param isSuccess Boolean indicating whether edit operation is successful.
    */
    onCardUpdate = (cardDetails: IProjectDetails, isSuccess: boolean) => {
        if (isSuccess) {
            this.allProjects.map((post: IProjectDetails) => {
                if (post.projectId === cardDetails.projectId) {
                    post.description = cardDetails.description;
                    post.title = cardDetails.title;
                    post.requiredSkills = cardDetails.requiredSkills;
                    post.status = cardDetails.status;
                    post.projectParticipantsUserIds = cardDetails.projectParticipantsUserIds;
                    post.projectParticipantsUserMapping = cardDetails.projectParticipantsUserMapping;
                    post.projectEndDate = cardDetails.projectEndDate;
                    post.projectStartDate = cardDetails.projectStartDate;
                    post.teamSize = cardDetails.teamSize;
                    post.supportDocuments = cardDetails.supportDocuments; 
                }
            });

            this.onFilterSearchTextChange(this.filterSearchText);
            this.showAlert(this.localize("postUpdateSuccess"), 1)
        }
        else {
            this.showAlert(this.localize("postUpdateError"), 2)
        }

    }

    /**
    * Invoked when new post is added. Shows notification alert.
    * @param isSuccess Boolean indicating whether add new post operation is successful.
    * @param getSubmittedPost Post details which needs to be added.
    */
    onNewPost = (isSuccess: boolean, getSubmittedPost: IProjectDetails) => {
        if (isSuccess) {
            let searchedAuthor = this.authorAvatarBackground.find((author) => author.id === getSubmittedPost.createdByUserId);
            if (searchedAuthor) {
                getSubmittedPost.avatarBackgroundColor = searchedAuthor.color;
            }
            else {
                let color = generateColor();
                this.authorAvatarBackground.push({ id: getSubmittedPost.createdByUserId, color: color });
                getSubmittedPost.avatarBackgroundColor = color;

                localStorage.setItem("avatar-colors", JSON.stringify(this.authorAvatarBackground));
            }

            let submittedPost = this.state.projectDetails;
            if (getSubmittedPost.createdByUserId === this.loggedInUserObjectId) {
                getSubmittedPost.isCurrentUserProject = true;
            }
            else {
                getSubmittedPost.isCurrentUserProject = false;
            }
            submittedPost.unshift(getSubmittedPost);
            this.setState({ projectDetails: submittedPost, initialProjects: submittedPost });
            this.allProjects = this.state.projectDetails;
            this.showAlert(this.localize("addNewPostSuccess"), 1)
        }
        else {
            this.showAlert(this.localize("addNewPostError"), 2)
        }
    }

    /**
    * Filters projects inline by user search text
    * @param searchText Search text entered by user.
    */
    onFilterSearchTextChange = (searchText: string) => {
        this.filterSearchText = searchText;
        if (searchText.trim().length) {
            let filteredPosts = this.allProjects.filter((post: IProjectDetails) => post.title.toLowerCase().includes(searchText.toLowerCase()) === true);
            this.setState({
                projectDetails: filteredPosts, loader: false, hasMoreProjects: this.hasMoreProjects, isPageInitialLoad: false
            });
        }
        else {
            this.setState({
                projectDetails: [...this.allProjects], loader: false, hasMoreProjects: this.hasMoreProjects, isPageInitialLoad: false
            });
        }
    }

    /**
    * Invoked when either filter bar is displayed or closed
    * @param isOpen Boolean indicating whether filter bar is displayed or closed.
    */
    handleFilterClear = (isOpen: boolean) => {
        if (!isOpen && (this.selectedPostprojectStatus.length > 0 || this.selectedSharedBy.length > 0 || this.selectedskills.length > 0 || this.selectedSortBy !== Resources.sortBy[0].id)) {
            this.setState({
                isPageInitialLoad: true,
                pageLoadStart: -1,
                infiniteScrollParentKey: this.state.infiniteScrollParentKey + 1,
                projectDetails: [],
                searchText: "",
                hasMoreProjects: true
            });
            this.allProjects = [];
        }
        this.setState({
            isFilterApplied: isOpen
        });
        this.resetAllFilters();
    }

    /**
    * Invoked when user hits enter or clicks on search icon for searching post through command bar
    */
    invokeApiSearch = () => {
        this.setState({
            isPageInitialLoad: true,
            pageLoadStart: -1,
            infiniteScrollParentKey: this.state.infiniteScrollParentKey + 1,
            projectDetails: [],
            isFilterApplied: false,
            hasMoreProjects: true
        });
        this.allProjects = [];
    }

    hideFilterbar = () => {
        return true;
    }

    handleCloseProjectButtonClick = (isSuccess: boolean, projectId: string) => {
        if (isSuccess) {
            this.allProjects.map((post: IProjectDetails) => {
                if (post.projectId === projectId) {
                    post.status = 4;
                }
            });
            this.showAlert(this.localize("projectCloseSuccess"), 1);
            this.onFilterSearchTextChange(this.filterSearchText);
        }
        else {
            this.showAlert(this.localize("projectCloseFailure"), 2);
        }
    }


    onProjectJoin = (projectId: string, isSuccess: boolean) => {
        if (isSuccess) {
            this.allProjects.map((post: IProjectDetails) => {
                if (post.projectId === projectId) {
                    if (post.projectParticipantsUserIds === "") {
                        post.projectParticipantsUserIds = post.projectParticipantsUserIds + this.loggedInUserObjectId;
                        post.projectParticipantsUserMapping = post.projectParticipantsUserMapping + this.loggedInUserObjectId + ":" + this.loggedInUserName;
                    }
                    else {
                        post.projectParticipantsUserIds = post.projectParticipantsUserIds + ";" + this.loggedInUserObjectId;
                        post.projectParticipantsUserMapping = post.projectParticipantsUserMapping + ";" + this.loggedInUserObjectId + ":" + this.loggedInUserName;
                    }
                }
                
            });

            this.setState({
                projectDetails: this.allProjects
            })
            this.onFilterSearchTextChange(this.filterSearchText);
            this.showAlert(this.localize("projectJoinedSuccess"), 1)
        }
        else {
            this.showAlert(this.localize("projectJoinedFailure"), 2)
        }
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        return (
            <div>
                {this.getWrapperPage()}
            </div>
        );
    }

    /**
    *Get wrapper for page which acts as container for all child components
    */
    private getWrapperPage = () => {
        if (this.state.loader) {
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

            // Cards component array to be rendered in grid.
            const cards = new Array<any>();

            this.state.projectDetails!.map((value: IProjectDetails, index) => {
                if (!value.isRemoved) {
                    cards.push(<Col lg={3} sm={6} md={4} className="grid-column d-flex justify-content-center">
                        <Card loggedInUserId={this.loggedInUserObjectId} projectDetails={this.state.projectDetails} onJoinMenuItemClick={this.onProjectJoin} onCloseProjectButtonClick={this.handleCloseProjectButtonClick} onLeaveButtonClick={this.handleLeaveButtonClick} showLeaveProjects={false} showJoinProjectMenu={true} index={index} cardDetails={value} onCardUpdate={this.onCardUpdate} onDeleteButtonClick={this.handleDeleteButtonClick} />
                    </Col>)
                }
            });

            if (this.state.initialProjects.length === 0) {
                return (
                    <div className="container-div">
                        <div className="container-subdiv">
                            <NotificationMessage onClose={this.hideAlert} showAlert={this.state.showAlert} content={this.state.alertMessage} notificationType={this.state.alertprojectStatus} />
                            <NoPostAddedPage showAddPost={true} onNewPostSubmit={this.onNewPost} />
                        </div>
                    </div>
                )
            }
            let scrollViewStyle = { height: this.state.isFilterApplied === true ? "84vh" : "92vh" };
            return (
                <div className="container-div">
                    <div className="container-subdiv-cardview">
                        <Container fluid className="container-fluid-overriden">
                            <NotificationMessage
                                onClose={this.hideAlert}
                                showAlert={this.state.showAlert}
                                content={this.state.alertMessage}
                                notificationType={this.state.alertprojectStatus}
                            />
                            <TitleBar
                                projectDetails={this.state.projectDetails}
                                showFilter={true}
                                teamId={this.teamId}
                                commandBarSearchText={this.state.searchText}
                                searchFilterProjectsUsingAPI={this.invokeApiSearch}
                                onFilterClear={this.handleFilterClear}
                                hideFilterbar={!this.state.isFilterApplied}
                                onSortByChange={this.onSortByChange}
                                onFilterSearchChange={this.onFilterSearchTextChange}
                                onSearchInputChange={this.handleSearchInputChange}
                                onNewPostSubmit={this.onNewPost}
                                onSharedByCheckboxStateChange={this.onSharedByCheckboxStateChange}
                                onTypeCheckboxStateChange={this.onprojectStatusCheckboxStateChange}
                                onSkillsStateChange={this.onskillsStateChange}
                            />
                            <div key={this.state.infiniteScrollParentKey} className="scroll-view scroll-view-mobile" style={scrollViewStyle}>
                                <InfiniteScroll
                                    pageStart={this.state.pageLoadStart}
                                    loadMore={this.loadMoreProjects}
                                    hasMore={this.state.hasMoreProjects && !this.filterSearchText.trim().length}
                                    initialLoad={this.state.isPageInitialLoad}
                                    useWindow={false}
                                    loader={<div className="loader"><Loader /></div>}>

                                    <Row>
                                        {
                                            cards.length ? cards : this.state.hasMoreProjects === true ? <></> : <FilterNoPostContentPage />
                                        }
                                    </Row>

                                </InfiniteScroll>
                            </div>

                        </Container>
                    </div>
                </div>
            );
        }
    }
}
export default withTranslation()(DiscoverWrapperPage)