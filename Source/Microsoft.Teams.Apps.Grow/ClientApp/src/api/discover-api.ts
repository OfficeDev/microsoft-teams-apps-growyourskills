// <copyright file="discover-api.ts" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import axios from "./axios-decorator";
import { getBaseUrl } from '../configVariables';

let baseAxiosUrl = getBaseUrl() + '/api';

/**
* Get All projects for tab.
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const getAllProjects = async (pageCount: number): Promise<any> => {

    let url = `${baseAxiosUrl}/project?pageCount=${pageCount}`;
    return await axios.get(url);
}

/**
* Get user created projects.
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const getMyCreatedProjects = async (pageCount: number): Promise<any> => {

    let url = `${baseAxiosUrl}/project/user-created-projects?pageCount=${pageCount}`;
    return await axios.get(url);
}

/**
* Get user joined projects.
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const getMyJoinedProjects = async (pageCount: number): Promise<any> => {

    let url = `${baseAxiosUrl}/project/user-joined-projects?pageCount=${pageCount}`;
    return await axios.get(url);
}

/**
* Get all projects for tab in a team.
* @param teamId Team Id for which projects needs to be fetched.
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const getTeamAllProjects = async (teamId: string, pageCount: number): Promise<any> => {

    let url = `${baseAxiosUrl}/teamproject/team-projects?teamId=${teamId}&pageCount=${pageCount}`;
    return await axios.get(url);
}

/**
* Get filtered projects for tab.
* @param projectStatus Selected project status separated by semicolon.
* @param addedByNames Selected project owner names separated by semicolon.
* @param skills Selected skills separated by semicolon
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const getFilteredProjects = async (projectStatus: string, addedByNames: string, skills: string, pageCount: number): Promise<any> => {
    let url = `${baseAxiosUrl}/project/applied-filters-projects?status=${projectStatus}&projectOwnerNames=${addedByNames}
                &pageCount=${pageCount}&skills=${encodeURIComponent(skills)}`;
    return await axios.get(url);
}

/**
* Get filtered projects for tab in a team.
* @param projectStatus Selected projects status separated by semicolon.
* @param addedByNames Selected project owner names separated by semicolon.
* @param skills Selected skills separated by semicolon.
* @param teamId Team Id for which projects needs to be fetched.
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const getFilteredTeamProjects = async (projectStatus: string, addedByNames: string, skills: string, teamId: string, pageCount: number): Promise<any> => {
    let url = `${baseAxiosUrl}/teamproject/applied-filters-projects?status=${projectStatus}&projectOwnerNames=${addedByNames}
                &pageCount=${pageCount}&teamId=${teamId}&skills=${encodeURIComponent(skills)}`;
    return await axios.get(url);
}

/**
* Get unique skills.
*/
export const getSkills = async (): Promise<any> => {
    let url = `${baseAxiosUrl}/project/unique-skills?searchText=*`;
    return await axios.get(url);
}

/**
* Update project content details.
* @param projectContent Project details object to be updated.
*/
export const updateProjectContent = async (projectContent: any): Promise<any> => {

    let url = `${baseAxiosUrl}/project`;
    return await axios.patch(url, projectContent);
}

/**
* Add new project.
* @param projectContent Project details object to be added.
*/
export const addNewProjectContent = async (projectContent: any): Promise<any> => {

    let url = `${baseAxiosUrl}/project`;
    return await axios.post(url, projectContent);
}

/**
* Delete project from storage.
* @param project details to be deleted.
*/
export const deleteProject = async (project: any): Promise<any> => {

    let url = `${baseAxiosUrl}/project?projectId=${project.projectId}&userId=${project.createdByUserId}`;
    return await axios.delete(url);
}

/**
* Get list of project owners.
*/
export const getProjectOwners = async (): Promise<any> => {

    let url = `${baseAxiosUrl}/project/project-owners`;
    return await axios.get(url);
}

/**
* Get list of project owners for a team based on configured skills.
*/
export const getTeamAuthors = async (teamId: string): Promise<any> => {

    let url = `${baseAxiosUrl}/teamproject/project-owners-for-team-skills?teamId=` + teamId;
    return await axios.get(url);
}

/**
* Filter data based on title and skills.
* @param searchText Search text typed by user.
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const filterTitleAndSkills = async (searchText: string, pageCount: number): Promise<any> => {
    let url = baseAxiosUrl + `/project/search-projects?searchText=${encodeURIComponent(searchText)}&pageCount=${pageCount}`;
    return await axios.get(url);
}

/**
* Filter data based on title and skills for a team.
* @param searchText Search text typed by user.
* @param teamId Team Id for which projects needs to be filtered.
* @param pageCount Current page count for which projects needs to be fetched.
*/
export const filterTitleAndSkillsTeam = async (searchText: string, teamId: string, pageCount: number): Promise<any> => {
    let url = baseAxiosUrl + `/teamproject/team-search-projects?searchText=${encodeURIComponent(searchText)}&teamId=${teamId}&pageCount=${pageCount}`;
    return await axios.get(url);
}

/**
* Join a project.
* @param projectContent Search text typed by user.
*/
export const joinProject = async (projectContent : any): Promise<any> => {
    let url = baseAxiosUrl + `/project-workflow/join-project?projectId=${projectContent.projectId}&createdByUserId=${projectContent.createdByUserId}`;
    return await axios.post(url);
}

/**
* close a project.
* @param participantDetails Search text typed by user.
*/
export const closeProject = async (participantDetails: any): Promise<any> => {
    let url = baseAxiosUrl + `/project-workflow/close-project`;
    return await axios.post(url, participantDetails);
}

/**
* Get project details.
* @param projectId Project id to fetch details.
*/
export const getProjectDetailToJoin = async (projectId: string, createdByUserId: string): Promise<any> => {

    let url = `${baseAxiosUrl}/project/project-detail?projectId=${projectId}&createdByUserId=${createdByUserId}`;
    return await axios.get(url);
}