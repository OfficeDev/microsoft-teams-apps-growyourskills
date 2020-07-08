// <copyright file="TeamSkillStorageProvider.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.Providers
{
    using System;
    using System.Net;
    using System.Threading.Tasks;
    using Microsoft.Extensions.Logging;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;
    using Microsoft.Teams.Apps.Grow.Models.Configuration;
    using Microsoft.WindowsAzure.Storage.Table;

    /// <summary>
    /// Implements storage provider which helps to create, get, update or delete team skills data in Azure table storage.
    /// </summary>
    public class TeamSkillStorageProvider : BaseStorageProvider, ITeamSkillStorageProvider
    {
        /// <summary>
        /// Represents team skill entity name.
        /// </summary>
        private const string TeamSkillEntityName = "TeamSkillEntity";

        /// <summary>
        /// Initializes a new instance of the <see cref="TeamSkillStorageProvider"/> class.
        /// Handles storage read write operations.
        /// </summary>
        /// <param name="options">A set of key/value application configuration properties for Microsoft Azure Table storage.</param>
        /// <param name="logger">Sends logs to the logger service.</param>
        public TeamSkillStorageProvider(
            IOptions<StorageSetting> options,
            ILogger<BaseStorageProvider> logger)
            : base(options?.Value.ConnectionString, TeamSkillEntityName, logger)
        {
        }

        /// <summary>
        /// Get team skills data from storage.
        /// </summary>
        /// <param name="teamId">Team id for which need to fetch data.</param>
        /// <returns>A task that represents an object to hold team skills data.</returns>
        public async Task<TeamSkillEntity> GetTeamSkillsDataAsync(string teamId)
        {
            teamId = teamId ?? throw new ArgumentNullException(nameof(teamId));
            await this.EnsureInitializedAsync();

            var retrieveOperation = TableOperation.Retrieve<TeamSkillEntity>(teamId, teamId);
            var queryResult = await this.CloudTable.ExecuteAsync(retrieveOperation);

            if (queryResult?.Result != null)
            {
                return (TeamSkillEntity)queryResult.Result;
            }

            return null;
        }

        /// <summary>
        /// Delete configured skills for a team if Bot is uninstalled.
        /// </summary>
        /// <param name="teamId">Holds team id.</param>
        /// <returns>A boolean that represents team details is successfully deleted or not.</returns>
        public async Task<bool> DeleteTeamSkillsAsync(string teamId)
        {
            teamId = teamId ?? throw new ArgumentNullException(nameof(teamId));
            await this.EnsureInitializedAsync();

            var retrieveOperation = TableOperation.Retrieve<TeamSkillEntity>(teamId, teamId);
            var queryResult = await this.CloudTable.ExecuteAsync(retrieveOperation);

            if (queryResult?.Result != null)
            {
                TableOperation deleteOperation = TableOperation.Delete((TeamSkillEntity)queryResult?.Result);
                var result = await this.CloudTable.ExecuteAsync(deleteOperation);
                return result.HttpStatusCode == (int)HttpStatusCode.OK;
            }

            return false;
        }

        /// <summary>
        /// Stores or update team skills data in storage.
        /// </summary>
        /// <param name="teamSkillEntity">Represents team skill entity object.</param>
        /// <returns>A boolean that represents team skills entity is successfully saved/updated or not.</returns>
        public async Task<bool> UpsertTeamSkillsAsync(TeamSkillEntity teamSkillEntity)
        {
            var result = await this.StoreOrUpdateEntityAsync(teamSkillEntity);
            return result.HttpStatusCode == (int)HttpStatusCode.NoContent;
        }

        /// <summary>
        /// Stores or update team skills data in storage.
        /// </summary>
        /// <param name="teamSkillEntity">Represents team skill entity object.</param>
        /// <returns>A task that represents team skills entity data is saved or updated.</returns>
        private async Task<TableResult> StoreOrUpdateEntityAsync(TeamSkillEntity teamSkillEntity)
        {
            await this.EnsureInitializedAsync();
            TableOperation addOrUpdateOperation = TableOperation.InsertOrReplace(teamSkillEntity);
            return await this.CloudTable.ExecuteAsync(addOrUpdateOperation);
        }
    }
}
