// <copyright file="router.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import DiscoverWrapperPage from "../components/card-view/discover-wrapper-page";
import DiscoverTeamWrapperPage from "../components/card-view/discover-teams-wrapper-page";
import TeamsConfigPage from "../components/teams-config-page"
import SignInPage from "../components/signin/signin";
import SignInSimpleStart from "../components/signin/signin-start";
import SignInSimpleEnd from "../components/signin/signin-end";
import ProjectClosure from "../components/close-project/close-project-wrapper";
import CloseProjectDialog from "../components/close-project/close-project-dialog";
import SkillsAquiredTab from "../components/skills-aquired-tab/skills-aquired-wrapper";
import NewProjectDialog from "../components/new-project-dialog/new-project-dialog";
import EditProjectDialog from "../components/edit-project-dialog/edit-project-dialog";
import MyCreatedProjects from "../components/my-projects/my-created-projects";
import MyJoinedProjects from "../components/my-joined-projects/my-joined-projects";
import MyProjects from "../components/my-projects/my-projects";
import JoinProject from "../components/join-project-dialog/join-project-dialog";
import JoinProjectSuccessPage from "../components/join-project-dialog/join-project-success";
import "../i18n";
import Redirect from "../components/redirect";
import ErrorPage from "../components/error-page";

export const AppRoute: React.FunctionComponent<{}> = () => {

    return (
        <Suspense fallback={<div className="container-div"><div className="container-subdiv"></div></div>}>
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" component={DiscoverWrapperPage} />
                    <Route exact path="/discover" component={DiscoverWrapperPage} />
                    <Route exact path="/discover-team" component={DiscoverTeamWrapperPage} />
                    <Route exact path="/configtab" component={TeamsConfigPage} />
                    <Route exact path="/signin" component={SignInPage} />
                    <Route exact path="/signin-simple-start" component={SignInSimpleStart} />
                    <Route exact path="/signin-simple-end" component={SignInSimpleEnd} />
                    <Route exact path="/error" component={ErrorPage} />
                    <Route exact path="/project-closure" component={ProjectClosure} />
                    <Route exact path="/project-dialog" component={CloseProjectDialog} />
                    <Route exact path="/skill-acquired" component={SkillsAquiredTab} />
                    <Route exact path="/add-new-project" component={NewProjectDialog} />
                    <Route exact path="/edit-new-project" component={EditProjectDialog} />
                    <Route exact path="/my-created-projects" component={MyCreatedProjects} />
                    <Route exact path="/my-joined-projects" component={MyJoinedProjects} />
                    <Route exact path="/join-project" component={JoinProject} />
                    <Route exact path="/join-project-success" component={JoinProjectSuccessPage} />
                    <Route exact path="/my-projects" component={MyProjects} />
                    <Route component={Redirect} />
                </Switch>
            </BrowserRouter>
        </Suspense>
    );
}