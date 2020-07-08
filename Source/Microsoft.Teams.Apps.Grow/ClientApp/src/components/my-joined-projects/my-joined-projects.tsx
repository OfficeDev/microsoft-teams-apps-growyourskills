// <copyright file="my-joined-projects.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Loader } from "@fluentui/react-northstar";
import Card from "../card-view/card";
import FilterNoPostContentPage from "../card-view/filter-no-post-content-page";
import { Container, Col, Row } from "react-bootstrap";
import * as microsoftTeams from "@microsoft/teams-js";
import { getMyJoinedProjects } from "../../api/discover-api";
import { generateColor } from "../../helpers/helper";
import NotificationMessage from "../notification-message/notification-message";
import { WithTranslation, withTranslation } from "react-i18next";
import { IProjectDetails } from "../card-view/discover-wrapper-page";
import { TFunction } from "i18next";
import { ICheckBoxItem } from "../filter-bar/filter-bar";
import Resources from "../../constants/resources";
import InfiniteScroll from 'react-infinite-scroller';

import 'bootstrap/dist/css/bootstrap.min.css';
import "../../styles/site.css";
import "../../styles/card.css";


export interface ICardViewStateProps extends WithTranslation {
    showProjectCount: () => void;
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

class MyJoinedProjects extends React.Component<ICardViewStateProps, ICardViewState> {

    localize: TFunction;
    selectedSharedBy: Array<ICheckBoxItem>;
    selectedPostprojectStatus: Array<ICheckBoxItem>;
    selectedskills: Array<ICheckBoxItem>;
    selectedSortBy: string;
    filterSearchText: string;
    allProjects: Array<IProjectDetails>;
    loggedInUserObjectId: string;
    teamId: string;
    authorAvatarBackground: Array<any>;

    constructor(props: any) {
        super(props);
        let colors = localStorage.getItem("avatar-colors");
        this.localize = this.props.t;
        this.selectedSharedBy = [];
        this.selectedPostprojectStatus = [];
        this.selectedskills = [];
        this.selectedSortBy = "";
        this.filterSearchText = "";
        this.allProjects = [];
        this.loggedInUserObjectId = "";
        this.teamId = "";
        this.authorAvatarBackground = colors === null ? [] : JSON.parse(colors!);

        this.state = {
            loader: false,
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
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.loggedInUserObjectId = context.userObjectId!;
        });
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
    * Fetch projects for Team tab from API
    * @param pageCount Page count for which next set of projects needs to be fetched
    */
    getJoinedProjects = async (pageCount: number) => {
        let hasMoreProjects = this.state.hasMoreProjects;
        let response = await getMyJoinedProjects(pageCount);
        if (response.status === 200 && response.data) {
            if (response.data.length < 50) {
                hasMoreProjects = false;
            }
            else {
                hasMoreProjects = true;
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

            this.setState({
                projectDetails: this.allProjects,
                isPageInitialLoad: false,
                hasMoreProjects: hasMoreProjects
            });

            if (response.data.count === 0) {
                this.setState({
                    showNoProjectPage: true
                })
            }
        }
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
            this.props.showProjectCount();
        }
        else {
            this.showAlert(this.localize("leaveProjectError"), 2);
        }
    }

    /**
    *Invoked by Infinite scroll component when user scrolls down to fetch next set of projects
    *@param pageCount Page count for which next set of projects needs to be fetched
    */
    loadMoreProjects = (pageCount: number) => {
        this.getJoinedProjects(pageCount);
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
                    post.supportDocuments = cardDetails.supportDocuments;
                    post.requiredSkills = cardDetails.requiredSkills;
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
    * Filters projects inline by user search text
    * @param searchText Search text entered by user.
    */
    onFilterSearchTextChange = (searchText: string) => {
        this.filterSearchText = searchText;
        if (searchText.trim().length) {
            let filteredProjects = this.allProjects.filter((post: IProjectDetails) => post.title.toLowerCase().includes(searchText.toLowerCase()) === true);

            this.setState({ projectDetails: filteredProjects });
        }
        else {
            this.setState({ projectDetails: [...this.allProjects] });
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

    handleCloseProjectButtonClick = (isSuccess: boolean) => {
        console.log("a");
    }

    onProjectJoin = (projectId: string, isSuccess: boolean) => {
        if (isSuccess) {
            this.allProjects.map((post: IProjectDetails) => {
                if (post.projectId === projectId) {
                    post.projectParticipantsUserIds = post.projectParticipantsUserIds + ";" + this.loggedInUserObjectId;
                }
            });

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
        // Cards component array to be rendered in grid.
        const cards = new Array<any>();

        this.state.projectDetails!.map((value: IProjectDetails, index) => {
            if (!value.isRemoved) {
                cards.push(<Col lg={3} sm={6} md={4} className="grid-column d-flex justify-content-center">
                    <Card loggedInUserId={this.loggedInUserObjectId} projectDetails={this.state.projectDetails} onJoinMenuItemClick={this.onProjectJoin} onCloseProjectButtonClick={this.handleCloseProjectButtonClick} onLeaveButtonClick={this.handleLeaveButtonClick} showLeaveProjects={true} showJoinProjectMenu={false} index={index} cardDetails={value} onCardUpdate={this.onCardUpdate} onDeleteButtonClick={this.handleDeleteButtonClick} />
                </Col>)
            }
        });

        let scrollViewStyle = { height: this.state.isFilterApplied === true ? "84vh" : "92vh" };
        return (
            <div className="container-subdiv">
                <div className="container-subdiv-cardview">
                    <Container fluid className="container-fluid-overriden">
                        <NotificationMessage
                            onClose={this.hideAlert}
                            showAlert={this.state.showAlert}
                            content={this.state.alertMessage}
                            notificationType={this.state.alertprojectStatus}
                        />
                        <div key={this.state.infiniteScrollParentKey} className="scroll-view scroll-view-mobile" style={scrollViewStyle}>
                            <InfiniteScroll
                                pageStart={this.state.pageLoadStart}
                                loadMore={this.loadMoreProjects}
                                hasMore={this.state.hasMoreProjects}
                                initialLoad={this.state.isPageInitialLoad}
                                useWindow={false}
                                loader={<div className="loader"><Loader /></div>}>

                                <Row>
                                    {
                                        cards.length ? cards : this.state.hasMoreProjects ? <></> : <FilterNoPostContentPage />
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
export default withTranslation()(MyJoinedProjects)