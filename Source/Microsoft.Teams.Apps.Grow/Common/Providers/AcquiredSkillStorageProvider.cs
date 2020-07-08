// <copyright file="AcquiredSkillStorageProvider.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.Providers
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using System.Threading.Tasks;
    using Microsoft.Extensions.Logging;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;
    using Microsoft.Teams.Apps.Grow.Models.Configuration;
    using Microsoft.WindowsAzure.Storage.Table;

    /// <summary>
    /// Implements storage provider which stores acquired skills data in Azure table storage.
    /// </summary>
    public class AcquiredSkillStorageProvider : BaseStorageProvider, IAcquiredSkillStorageProvider
    {
        /// <summary>
        /// Represents acquired skill entity name.
        /// </summary>
        private const string AcquiredSkillEntityName = "AcquiredSkillEntity";

        /// <summary>
        /// Initializes a new instance of the <see cref="AcquiredSkillStorageProvider"/> class.
        /// </summary>
        /// <param name="options">A set of key/value application configuration properties for Microsoft Azure Table storage.</param>
        /// <param name="logger">Sends logs to the logger service.</param>
        public AcquiredSkillStorageProvider(
            IOptions<StorageSetting> options,
            ILogger<BaseStorageProvider> logger)
            : base(options?.Value.ConnectionString, AcquiredSkillEntityName, logger)
        {
        }

        /// <summary>
        /// Stores or updates acquired skills data for a user.
        /// </summary>
        /// <param name="entity">Holds acquired skill detail.</param>
        /// <returns>A task that represents acquired skills is saved or updated.</returns>
        public async Task<bool> UpsertAcquiredSkillAsync(AcquiredSkillsEntity entity)
        {
            await this.EnsureInitializedAsync();
            TableOperation addOrUpdateOperation = TableOperation.InsertOrReplace(entity);
            var result = await this.CloudTable.ExecuteAsync(addOrUpdateOperation);
            return result.HttpStatusCode == (int)HttpStatusCode.NoContent;
        }

        /// <summary>
        /// Get acquired skills of a user.
        /// </summary>
        /// <param name="userId">Azure Active Directory id of user.</param>
        /// <returns>A task that represents a collection of acquired skills.</returns>
        public async Task<IEnumerable<AcquiredSkillsEntity>> GetAcquiredSkillsAsync(string userId)
        {
            userId = userId ?? throw new NullReferenceException(nameof(userId));

            await this.EnsureInitializedAsync();
            string userIdCondition = TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, userId);

            TableQuery<AcquiredSkillsEntity> query = new TableQuery<AcquiredSkillsEntity>().Where(userIdCondition);
            TableContinuationToken continuationToken = null;
            var acquiredSkills = new List<AcquiredSkillsEntity>();

            do
            {
                var queryResult = await this.CloudTable.ExecuteQuerySegmentedAsync(query, continuationToken);
                if (queryResult?.Results != null)
                {
                    acquiredSkills.AddRange(queryResult.Results);
                    continuationToken = queryResult.ContinuationToken;
                }
            }
            while (continuationToken != null);

            return acquiredSkills;
        }
    }
}
