// <copyright file="ITeamSkillStorageProvider.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.Interfaces
{
    using System.Threading.Tasks;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Interface for provider which helps in storing, updating or deleting team skills.
    /// </summary>
    public interface ITeamSkillStorageProvider
    {
        /// <summary>
        /// Stores or updates team skills.
        /// </summary>
        /// <param name="teamSkillEntity">Holds team skills detail entity data.</param>
        /// <returns>A task that represents team skills entity data is saved or updated.</returns>
        Task<bool> UpsertTeamSkillsAsync(TeamSkillEntity teamSkillEntity);

        /// <summary>
        /// Get configured skills for a team.
        /// </summary>
        /// <param name="teamId">Team id for which need to fetch data.</param>
        /// <returns>A task that represents to hold team skills data.</returns>
        Task<TeamSkillEntity> GetTeamSkillsDataAsync(string teamId);

        /// <summary>
        /// Delete configured skills for a team if Bot is uninstalled.
        /// </summary>
        /// <param name="teamId">Holds team id.</param>
        /// <returns>A task that represents team skills data is deleted.</returns>
        Task<bool> DeleteTeamSkillsAsync(string teamId);
    }
}
