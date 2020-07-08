// <copyright file="TeamStorageProvider.cs" company="Microsoft">
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
    /// Grow Azure table storage provider.
    /// </summary>
    public class TeamStorageProvider : BaseStorageProvider, ITeamStorageProvider
    {
        private const string TeamConfigurationTable = "TeamConfiguration";

        /// <summary>
        /// Initializes a new instance of the <see cref="TeamStorageProvider"/> class.
        /// </summary>
        /// <param name="options">A set of key/value application configuration properties for Microsoft Azure Table storage.</param>
        /// <param name="logger">Sends logs to the logger service.</param>
        public TeamStorageProvider(
            IOptions<StorageSetting> options,
            ILogger<TeamStorageProvider> logger)
            : base(options?.Value.ConnectionString, TeamConfigurationTable, logger)
        {
        }

        /// <summary>
        /// Store or update team detail in Azure table storage.
        /// </summary>
        /// <param name="teamEntity">Represents team entity used for storage and retrieval.</param>
        /// <returns><see cref="Task"/> that represents team entity is saved or updated.</returns>
        public async Task<bool> UpsertTeamDetailAsync(TeamEntity teamEntity)
        {
            var result = await this.StoreOrUpdateEntityAsync(teamEntity);

            return result.HttpStatusCode == (int)HttpStatusCode.NoContent;
        }

        /// <summary>
        /// Get already team detail from Azure table storage.
        /// </summary>
        /// <param name="teamId">Team Id.</param>
        /// <returns><see cref="Task"/> Already saved team detail.</returns>
        public async Task<TeamEntity> GetTeamDetailAsync(string teamId)
        {
            if (string.IsNullOrWhiteSpace(teamId))
            {
                return null;
            }

            await this.EnsureInitializedAsync();
            var operation = TableOperation.Retrieve<TeamEntity>(teamId, teamId);
            var data = await this.CloudTable.ExecuteAsync(operation);
            return data.Result as TeamEntity;
        }

        /// <summary>
        /// This method delete the team detail record from table.
        /// </summary>
        /// <param name="teamEntity">Team configuration table entity.</param>
        /// <returns>A <see cref="Task"/> of type bool where true represents entity record is successfully deleted from table while false indicates failure in deleting data.</returns>
        public async Task<bool> DeleteTeamDetailAsync(TeamEntity teamEntity)
        {
            teamEntity = teamEntity ?? throw new ArgumentNullException(nameof(teamEntity));

            await this.EnsureInitializedAsync();
            TableOperation insertOrMergeOperation = TableOperation.Delete(teamEntity);
            TableResult result = await this.CloudTable.ExecuteAsync(insertOrMergeOperation);

            return result.HttpStatusCode == (int)HttpStatusCode.NoContent;
        }

        /// <summary>
        /// Stores or update team details data in Microsoft Azure Table storage.
        /// </summary>
        /// <param name="entity">Holds team idea detail entity data.</param>
        /// <returns>A task that represents idea post entity data is saved or updated.</returns>
        private async Task<TableResult> StoreOrUpdateEntityAsync(TeamEntity entity)
        {
            entity = entity ?? throw new ArgumentNullException(nameof(entity));
            if (string.IsNullOrWhiteSpace(entity.ServiceUrl) || string.IsNullOrWhiteSpace(entity.TeamId))
            {
                return null;
            }

            await this.EnsureInitializedAsync();
            TableOperation addOrUpdateOperation = TableOperation.InsertOrReplace(entity);
            return await this.CloudTable.ExecuteAsync(addOrUpdateOperation);
        }
    }
}
