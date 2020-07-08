// <copyright file="ProjectHelper.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using Microsoft.CodeAnalysis;
    using Microsoft.Extensions.Logging;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Implements project helper which is responsible for storing, updating or deleting project data in storage.
    /// </summary>
    public class ProjectHelper : IProjectHelper
    {
        /// <summary>
        /// Logs errors and information.
        /// </summary>
        private readonly ILogger<ProjectHelper> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="ProjectHelper"/> class.
        /// </summary>
        /// <param name="logger">Logs errors and information.</param>
        public ProjectHelper(
            ILogger<ProjectHelper> logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Get filtered projects as per the configured skills.
        /// </summary>
        /// <param name="projects">Project entities.</param>
        /// <param name="searchText">Search text for skills.</param>
        /// <returns>Represents a collection of projects.</returns>
        public IEnumerable<ProjectEntity> GetFilteredProjectsAsPerSkills(IEnumerable<ProjectEntity> projects, string searchText)
        {
            try
            {
                projects = projects ?? throw new ArgumentNullException(nameof(projects));
                searchText = searchText ?? throw new ArgumentNullException(nameof(searchText));
                var filteredProjects = new List<ProjectEntity>();

                var searchedSkills = searchText.Split(";").Where(skill => !string.IsNullOrEmpty(skill)).Select(skill => skill.Trim());

                foreach (var project in projects)
                {
                    if (!string.IsNullOrEmpty(project.RequiredSkills))
                    {
                        var requiredSkills = project.RequiredSkills.Split(";");

                        if (requiredSkills.Intersect(searchedSkills).Any())
                        {
                            filteredProjects.Add(project);
                        }
                    }
                }

                return filteredProjects;
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Exception occurred while getting filtered projects as per the skills.");
                throw;
            }
        }

        /// <summary>
        /// Create skills query to fetch projects.
        /// </summary>
        /// <param name="skills">Skills of projects.</param>
        /// <returns>Represents skills query to fetch projects.</returns>
        public string CreateSkillsQuery(string skills)
        {
            try
            {
                if (!string.IsNullOrEmpty(skills))
                {
                    var projectSkills = skills
                        .Split(';')
                        .Where(skill => !string.IsNullOrWhiteSpace(skill));

                    return string.Join(" ", projectSkills);
                }

                return string.Empty;
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Exception occurred while preparing the query for skills to get projects as per the configured skills.");
                throw;
            }
        }

        /// <summary>
        /// Create status and project owner names query to fetch projects as per the selected filter.
        /// </summary>
        /// <param name="status">Semicolon separated status of projects like Not started/Active/Blocked/Closed.</param>
        /// <param name="projectOwnerNames">Semicolon separated project owner names to filter the projects.</param>
        /// <returns>Represents a combined query for status and project owner names.</returns>
        public string CreateFilterSearchQuery(string status, string projectOwnerNames)
        {
            try
            {
                var projectStatusQuery = this.CreateProjectStatusQuery(status);
                var projectOwnerNamesQuery = this.CreateProjectOwnerNamesQuery(projectOwnerNames);

                if (string.IsNullOrEmpty(projectStatusQuery) && string.IsNullOrEmpty(projectOwnerNamesQuery))
                {
                    return null;
                }

                if (!string.IsNullOrEmpty(projectStatusQuery) && !string.IsNullOrEmpty(projectOwnerNamesQuery))
                {
                    return $"({projectStatusQuery}) and ({projectOwnerNamesQuery})";
                }

                if (!string.IsNullOrEmpty(projectStatusQuery))
                {
                    return $"({projectStatusQuery})";
                }

                if (!string.IsNullOrEmpty(projectOwnerNamesQuery))
                {
                    return $"({projectOwnerNamesQuery})";
                }

                return null;
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Exception occurred while preparing the combined query for status and projects owner names.");
                throw;
            }
        }

        /// <summary>
        /// Get projects unique skills.
        /// </summary>
        /// <param name="projects">Project entities.</param>
        /// <param name="searchText">Search text for skills.</param>
        /// <returns>Represents a collection of unique skills.</returns>
        public IEnumerable<string> GetUniqueSkills(IEnumerable<ProjectEntity> projects, string searchText)
        {
            try
            {
                projects = projects ?? throw new ArgumentNullException(nameof(projects));
                var skills = new List<string>();

                if (searchText == "*")
                {
                    foreach (var project in projects)
                    {
                        skills.AddRange(project.RequiredSkills?.Split(";"));
                    }
                }
                else
                {
                    foreach (var project in projects)
                    {
                        skills.AddRange(project.RequiredSkills?.Split(";").Where(skill => skill.Contains(searchText, StringComparison.InvariantCultureIgnoreCase)));
                    }
                }

                return skills.Distinct().OrderBy(skill => skill);
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Exception occurred while getting unique skills.");
                throw;
            }
        }

        /// <summary>
        /// Get filtered projects joined by a user.
        /// </summary>
        /// <param name="projects">project entities.</param>
        /// <param name="userAadObjectId">Azure Active Directory id of user.</param>
        /// <returns>Represents user joined projects.</returns>
        public IEnumerable<ProjectEntity> GetFilteredProjectsJoinedByUser(IEnumerable<ProjectEntity> projects, string userAadObjectId)
        {
            try
            {
                projects = projects ?? throw new ArgumentNullException(nameof(projects));
                userAadObjectId = userAadObjectId ?? throw new ArgumentNullException(nameof(userAadObjectId));

                var filteredProjects = new List<ProjectEntity>();

                foreach (var project in projects)
                {
                    if (!string.IsNullOrEmpty(project.ProjectParticipantsUserIds))
                    {
                        if (Array.Exists(project.ProjectParticipantsUserIds.Split(";"), userId => userId == userAadObjectId))
                        {
                            filteredProjects.Add(project);
                        }
                    }
                }

                return filteredProjects;
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Exception occurred while filtering the user joined projects.");
                throw;
            }
        }

        /// <summary>
        /// Escaping unsafe and reserved characters from Azure Search Service search query.
        /// Special characters that requires escaping includes
        /// + - &amp; | ! ( ) { } [ ] ^ " ~ * ? : \ /
        /// Refer https://docs.microsoft.com/en-us/azure/search/query-lucene-syntax#escaping-special-characters to know more.
        /// </summary>
        /// <param name="query">Query which the user had typed in search field.</param>
        /// <returns>Returns string escaping unsafe and reserved characters.</returns>
        public string EscapeCharactersForSearchQuery(string query)
        {
            string pattern = @"([_|\\@&\?\*\+!-:~'\^/(){}<>#&\[\]])";
            string substitution = "\\$&";
            query = Regex.Replace(query, pattern, substitution);

            return query;
        }

        /// <summary>
        /// Create project status query to fetch projects as per the selected filter.
        /// </summary>
        /// <param name="status">Semicolon separated status of projects like Not started/Active/Blocked/Closed.</param>
        /// <returns>Represents project status query.</returns>
        private string CreateProjectStatusQuery(string status)
        {
            try
            {
                if (string.IsNullOrEmpty(status))
                {
                    return null;
                }

                var statuses = status.Split(";")
                     .Where(projectStatus => !string.IsNullOrWhiteSpace(projectStatus))
                     .Select(projectStatus => $"{nameof(ProjectEntity.Status)} eq {projectStatus}");

                return string.Join(" or ", statuses);
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Exception occurred while preparing the query for projects status to get projects as per selected status.");
                throw;
            }
        }

        /// <summary>
        /// Create project owner names query to fetch projects as per the selected filter.
        /// </summary>
        /// <param name="projectOwnerNames">Semicolon separated project owner names to filter the projects.</param>
        /// <returns>Represents project owner names query to filter projects.</returns>
        private string CreateProjectOwnerNamesQuery(string projectOwnerNames)
        {
            try
            {
                if (string.IsNullOrEmpty(projectOwnerNames))
                {
                    return null;
                }

                var owners = projectOwnerNames.Split(";")
                     .Where(name => !string.IsNullOrWhiteSpace(name))
                     .Select(name => $"{nameof(ProjectEntity.CreatedByName)} eq '{this.EscapeCharactersForSearchQuery(name)}'");

                return string.Join(" or ", owners);
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Exception occurred while preparing the query for project owner names to get projects as per the selected owner names.");
                throw;
            }
        }
    }
}
