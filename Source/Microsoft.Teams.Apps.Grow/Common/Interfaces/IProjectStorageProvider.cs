// <copyright file="IProjectStorageProvider.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>
namespace Microsoft.Teams.Apps.Grow.Common.Interfaces
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Interface for provider which helps in retrieving, storing, updating and deleting project details.
    /// </summary>
    public interface IProjectStorageProvider
    {
        /// <summary>
        /// Get all projects.
        /// </summary>
        /// <param name="isRemoved">Represent whether a project is deleted or not.</param>
        /// <returns>A task that represent collection to hold projects.</returns>
        Task<IEnumerable<ProjectEntity>> GetProjectsAsync(bool isRemoved);

        /// <summary>
        /// Stores or updates project details.
        /// </summary>
        /// <param name="projectEntity">Holds project entity data.</param>
        /// <returns>A task that represents project entity data is saved or updated.</returns>
        Task<bool> UpsertProjectAsync(ProjectEntity projectEntity);

        /// <summary>
        /// Get project details.
        /// </summary>
        /// <param name="userId">Azure Active Directory id of user to fetch the post details.</param>
        /// <param name="projectId">Project id to fetch the project details.</param>
        /// <returns>A task that represent a object to hold project data.</returns>
        Task<ProjectEntity> GetProjectAsync(string userId, string projectId);

        /// <summary>
        /// Get details for a particular project.
        /// </summary>
        /// <param name="projectId">Project id to fetch the project details.</param>
        /// <returns>A task that represent a object to hold project data.</returns>
        Task<ProjectEntity> GetJoinProjectDetailsAsync(string projectId);

        /// <summary>
        /// Updates project data in storage.
        /// </summary>
        /// <param name="projectEntity">Holds project data.</param>
        /// <returns>A task that represents project data is updated.</returns>
        Task<bool> UpdateProjectAsync(ProjectEntity projectEntity);
    }
}