// <copyright file="IProjectHelper.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.Interfaces
{
    using System.Collections.Generic;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Interface for project helper.
    /// </summary>
    public interface IProjectHelper
    {
        /// <summary>
        /// Get filtered projects as per the configured skills.
        /// </summary>
        /// <param name="projects">A collection of projects.</param>
        /// <param name="searchText">Search text for skills.</param>
        /// <returns>Represents a collection of projects.</returns>
        IEnumerable<ProjectEntity> GetFilteredProjectsAsPerSkills(IEnumerable<ProjectEntity> projects, string searchText);

        /// <summary>
        /// Create skills query to fetch projects.
        /// </summary>
        /// <param name="skills">Skills of projects.</param>
        /// <returns>Represents skills query to fetch projects.</returns>
        string CreateSkillsQuery(string skills);

        /// <summary>
        /// Create status and project owner names query to fetch projects as per the selected filter.
        /// </summary>
        /// <param name="status">Semicolon separated status of projects like Not started/Active/Blocked/Closed.</param>
        /// <param name="projectOwnerNames">Semicolon separated project owner names to filter the projects.</param>
        /// <returns>Represents a combined query for status and project owner names.</returns>
        string CreateFilterSearchQuery(string status, string projectOwnerNames);

        /// <summary>
        /// Get projects unique skills.
        /// </summary>
        /// <param name="projects">Project entities.</param>
        /// <param name="searchText">Search text for skills.</param>
        /// <returns>Represents a collection of unique skills.</returns>
        IEnumerable<string> GetUniqueSkills(IEnumerable<ProjectEntity> projects, string searchText);

        /// <summary>
        /// Get filtered projects joined by a user.
        /// </summary>
        /// <param name="projects">project entities.</param>
        /// <param name="userAadObjectId">Azure Active Directory id of user.</param>
        /// <returns>Represents user joined projects.</returns>
        IEnumerable<ProjectEntity> GetFilteredProjectsJoinedByUser(IEnumerable<ProjectEntity> projects, string userAadObjectId);

        /// <summary>
        /// Escaping unsafe and reserved characters from Azure Search Service search query.
        /// https://docs.microsoft.com/en-us/azure/search/query-lucene-syntax#escaping-special-characters
        /// </summary>
        /// <param name="query">Query which the user had typed in search field.</param>
        /// <returns>Returns string escaping unsafe and reserved characters.</returns>
        string EscapeCharactersForSearchQuery(string query);
    }
}
