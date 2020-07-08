// <copyright file="teams-config-tab-api.ts" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import axios from "./axios-decorator";
import { getBaseUrl } from '../configVariables';

let baseAxiosUrl = getBaseUrl() + '/api';

/**
* Project config skills for a team.
* @param postContent Skills to be saved.
*/
export const submitConfiguredSkills = async (postContent: any): Promise<any> => {
    let url = `${baseAxiosUrl}/teamskills`;
    return await axios.post(url, postContent);
}

/**
* Get configured skills for a team.
* @param teamId Team Id for which configured skills needs to be fetched.
*/
export const getConfigSkills = async (teamId: string): Promise<any> => {
    let url = `${baseAxiosUrl}/teamskills?teamId=${teamId}`;
    return await axios.get(url);
}

/**
* Filter skills as per user search input.
* @param searchText Search text entered by user for filtering skills.
*/
export const filterSkills = async (searchText: string): Promise<any> => {
    let url = `${baseAxiosUrl}/project/unique-skills?searchText=${encodeURIComponent(searchText)}`;
    return await axios.get(url);
}