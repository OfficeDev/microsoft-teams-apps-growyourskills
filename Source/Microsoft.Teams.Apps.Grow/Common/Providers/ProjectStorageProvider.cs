// <copyright file="ProjectStorageProvider.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.Providers
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Net;
    using System.Threading.Tasks;
    using Microsoft.Extensions.Logging;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;
    using Microsoft.Teams.Apps.Grow.Models.Configuration;
    using Microsoft.WindowsAzure.Storage.Table;

    /// <summary>
    /// Implements storage provider which stores projects data in Azure table storage.
    /// </summary>
    public class ProjectStorageProvider : BaseStorageProvider, IProjectStorageProvider
    {
        /// <summary>
        /// Represents project entity name.
        /// </summary>
        private const string ProjectEntityName = "ProjectEntity";

        /// <summary>
        /// Represent a column name.
        /// </summary>
        private const string IsRemovedColumnName = "IsRemoved";

        /// <summary>
        /// Initializes a new instance of the <see cref="ProjectStorageProvider"/> class.
        /// Handles storage read write operations.
        /// </summary>
        /// <param name="options">A set of key/value application configuration properties for Microsoft Azure Table storage.</param>
        /// <param name="logger">Sends logs to the logger service.</param>
        public ProjectStorageProvider(
            IOptions<StorageSetting> options,
            ILogger<BaseStorageProvider> logger)
            : base(options?.Value.ConnectionString, ProjectEntityName, logger)
        {
        }

        /// <summary>
        /// Get projects data from storage.
        /// </summary>
        /// <param name="isRemoved">Represent whether a project is deleted or not.</param>
        /// <returns>A task that represent collection to hold projects.</returns>
        public async Task<IEnumerable<ProjectEntity>> GetProjectsAsync(bool isRemoved)
        {
            await this.EnsureInitializedAsync();

            string isRemovedCondition = TableQuery.GenerateFilterConditionForBool(IsRemovedColumnName, QueryComparisons.Equal, isRemoved);
            TableQuery<ProjectEntity> query = new TableQuery<ProjectEntity>().Where(isRemovedCondition);
            TableContinuationToken continuationToken = null;
            var projects = new List<ProjectEntity>();

            do
            {
                var queryResult = await this.CloudTable.ExecuteQuerySegmentedAsync(query, continuationToken);
                if (queryResult?.Results != null)
                {
                    projects.AddRange(queryResult.Results);
                    continuationToken = queryResult.ContinuationToken;
                }
            }
            while (continuationToken != null);

            return projects;
        }

        /// <summary>
        /// Get project data from storage.
        /// </summary>
        /// <param name="userId">User id to fetch the post details.</param>
        /// <param name="projectId">Project id to fetch the project details.</param>
        /// <returns>A task that represent a object to hold project data.</returns>
        public async Task<ProjectEntity> GetProjectAsync(string userId, string projectId)
        {
            // When there is no project created by user and Messaging Extension is open, table initialization is required here before creating search index or data source or indexer.
            await this.EnsureInitializedAsync();

            if (string.IsNullOrEmpty(projectId) || string.IsNullOrEmpty(userId))
            {
                return null;
            }

            string partitionKeyCondition = TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, userId);
            string projectIdCondition = TableQuery.GenerateFilterCondition("RowKey", QueryComparisons.Equal, projectId);
            var combinedPartitionFilter = TableQuery.CombineFilters(partitionKeyCondition, TableOperators.And, projectIdCondition);

            string isRemovedCondition = TableQuery.GenerateFilterConditionForBool(IsRemovedColumnName, QueryComparisons.Equal, false);
            var combinedFilter = TableQuery.CombineFilters(combinedPartitionFilter, TableOperators.And, isRemovedCondition);

            TableQuery<ProjectEntity> query = new TableQuery<ProjectEntity>().Where(combinedFilter);
            var queryResult = await this.CloudTable.ExecuteQuerySegmentedAsync(query, null);

            return queryResult?.FirstOrDefault();
        }

        /// <summary>
        /// Get join project details from storage.
        /// </summary>
        /// <param name="projectId">Project id to fetch the project details.</param>
        /// <returns>A task that represent a object to hold project data.</returns>
        public async Task<ProjectEntity> GetJoinProjectDetailsAsync(string projectId)
        {
            // When there is no project created by user and Messaging Extension is open, table initialization is required here before creating search index or data source or indexer.
            await this.EnsureInitializedAsync();

            if (string.IsNullOrEmpty(projectId))
            {
                return null;
            }

            string projectIdCondition = TableQuery.GenerateFilterCondition("RowKey", QueryComparisons.Equal, projectId);
            string isRemovedCondition = TableQuery.GenerateFilterConditionForBool(IsRemovedColumnName, QueryComparisons.Equal, false);
            var combinedFilter = TableQuery.CombineFilters(projectIdCondition, TableOperators.And, isRemovedCondition);

            TableQuery<ProjectEntity> query = new TableQuery<ProjectEntity>().Where(combinedFilter);
            var queryResult = await this.CloudTable.ExecuteQuerySegmentedAsync(query, null);

            return queryResult?.FirstOrDefault();
        }

        /// <summary>
        /// Stores or updates project data in storage.
        /// </summary>
        /// <param name="projectEntity">Holds project data.</param>
        /// <returns>A task that represents project data is saved or updated.</returns>
        public async Task<bool> UpsertProjectAsync(ProjectEntity projectEntity)
        {
            var result = await this.StoreOrUpdateEntityAsync(projectEntity);
            return result.HttpStatusCode == (int)HttpStatusCode.NoContent;
        }

        /// <summary>
        /// Updates project data in storage.
        /// </summary>
        /// <param name="projectEntity">Holds project data.</param>
        /// <returns>A task that represents project data is updated.</returns>
        public async Task<bool> UpdateProjectAsync(ProjectEntity projectEntity)
        {
            await this.EnsureInitializedAsync();
            TableOperation addOrUpdateOperation = TableOperation.Replace(projectEntity);
            var result = await this.CloudTable.ExecuteAsync(addOrUpdateOperation);

            return result.HttpStatusCode == (int)HttpStatusCode.NoContent;
        }

        /// <summary>
        /// Stores or update project details data in storage.
        /// </summary>
        /// <param name="entity">Holds project detail entity data.</param>
        /// <returns>A task that represents project entity data is saved or updated.</returns>
        private async Task<TableResult> StoreOrUpdateEntityAsync(ProjectEntity entity)
        {
            await this.EnsureInitializedAsync();
            TableOperation addOrUpdateOperation = TableOperation.InsertOrReplace(entity);
            return await this.CloudTable.ExecuteAsync(addOrUpdateOperation);
        }
    }
}
