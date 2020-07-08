// <copyright file="ProjectSearchScope.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    /// <summary>
    /// Team post search scope.
    /// </summary>
    public enum ProjectSearchScope
    {
        /// <summary>
        /// All created projects.
        /// </summary>
        AllProjects,

        /// <summary>
        /// Created projects by current user.
        /// </summary>
        CreatedProjectsByUser,

        /// <summary>
        /// Current user joined projects.
        /// </summary>
        JoinedProjects,

        /// <summary>
        /// Get skills.
        /// </summary>
        UniqueSkills,

        /// <summary>
        /// Get projects as per the configured skills in a particular team.
        /// </summary>
        FilterAsPerTeamSkills,

        /// <summary>
        /// Get unique project owner names who created the project to show on filter bar drop-down list.
        /// </summary>
        UniqueProjectOwnerNames,

        /// <summary>
        /// Get projects as per the search text for Title/Description/Skills field.
        /// </summary>
        SearchProjects,

        /// <summary>
        /// Get projects as per the applied filters.
        /// </summary>
        FilterTeamProjects,
    }
}
