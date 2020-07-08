// <copyright file="UserDetailProvider.cs" company="Microsoft">
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
    /// Implements provider which stores user data in Azure table storage.
    /// </summary>
    public class UserDetailProvider : BaseStorageProvider, IUserDetailProvider
    {
        /// <summary>
        /// Represents user entity name.
        /// </summary>
        private const string UserDetailEntityName = "UserDetailEntity";

        /// <summary>
        /// Initializes a new instance of the <see cref="UserDetailProvider"/> class.
        /// Handles storage read write operations.
        /// </summary>
        /// <param name="options">A set of key/value application configuration properties for Microsoft Azure Table storage.</param>
        /// <param name="logger">Sends logs to the logger service.</param>
        public UserDetailProvider(
            IOptions<StorageSetting> options,
            ILogger<BaseStorageProvider> logger)
            : base(options?.Value.ConnectionString, UserDetailEntityName, logger)
        {
        }

        /// <summary>
        /// Adds a user entity in storage.
        /// </summary>
        /// <param name="userConversationId">User conversation id.</param>
        /// <param name="userAadObjectId">Azure Active Directory id of the user.</param>
        /// <param name="servicePath">Service URL for a tenant.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task AddUserDetailAsync(
            string userConversationId,
            string userAadObjectId,
            string servicePath)
        {
            var userDetailEntity = new UserDetailEntity
            {
                UserAadObjectId = userAadObjectId,
                RowKey = userAadObjectId,
                UserConversationId = userConversationId,
                ServiceUrl = servicePath,
            };

            await this.UpsertUserDetailAsync(userDetailEntity);
        }

        /// <summary>
        /// Get user data from storage.
        /// </summary>
        /// <param name="userAadObjectId">Azure Active Directory id of the user.</param>
        /// <returns>A task that represents an object to hold user data.</returns>
        public async Task<UserDetailEntity> GetUserDetailsAsync(string userAadObjectId)
        {
            userAadObjectId = userAadObjectId ?? throw new ArgumentNullException(nameof(userAadObjectId));

            await this.EnsureInitializedAsync();
            var retrieveOperation = TableOperation.Retrieve<UserDetailEntity>(userAadObjectId, userAadObjectId);
            var queryResult = await this.CloudTable.ExecuteAsync(retrieveOperation);

            if (queryResult?.Result != null)
            {
                return (UserDetailEntity)queryResult.Result;
            }

            return null;
        }

        /// <summary>
        /// Stores or update user details data in storage.
        /// </summary>
        /// <param name="entity">Holds user entity data.</param>
        /// <returns>A task that represents user entity data is saved or updated.</returns>
        private async Task<bool> UpsertUserDetailAsync(UserDetailEntity entity)
        {
            var result = await this.StoreOrUpdateEntityAsync(entity);
            return result.HttpStatusCode == (int)HttpStatusCode.NoContent;
        }

        /// <summary>
        /// Stores or update user detail in storage.
        /// </summary>
        /// <param name="entity">Holds user entity data.</param>
        /// <returns>A task that represents user entity data is saved or updated.</returns>
        private async Task<TableResult> StoreOrUpdateEntityAsync(UserDetailEntity entity)
        {
            await this.EnsureInitializedAsync();
            TableOperation addOrUpdateOperation = TableOperation.InsertOrReplace(entity);
            return await this.CloudTable.ExecuteAsync(addOrUpdateOperation);
        }
    }
}
