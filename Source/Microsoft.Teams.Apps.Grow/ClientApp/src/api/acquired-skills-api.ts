// <copyright file="acquired-skills-api.ts" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import axios from "./axios-decorator";
import { getBaseUrl } from '../configVariables';

let baseAxiosUrl = getBaseUrl() + '/api';

/**
* Get acquired skills for tab.
*/
export const getUserAcquiredSkills = async (): Promise<any> => {
    let url = `${baseAxiosUrl}/acquiredskill/acquired-skills`;
    return await axios.get(url);
}

/**
* Leave a project selected by user.
* @param post Project details data to leave a project.
*/
export const leaveProject = async (project: any): Promise<any> => {

    let url = `${baseAxiosUrl}/project-workflow/leave-project?projectId=${project.projectId}&createdByUserId=${project.createdByUserId}`;
    return await axios.post(url);
}

