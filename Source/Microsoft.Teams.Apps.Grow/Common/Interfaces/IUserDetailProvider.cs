// <copyright file="IUserDetailProvider.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.Interfaces
{
    using System.Threading.Tasks;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Interface for provider which stores user detail data.
    /// </summary>
    public interface IUserDetailProvider
    {
        /// <summary>
        /// Adds a user details.
        /// </summary>
        /// <param name="userConversationId">User conversation id.</param>
        /// <param name="userAadObjectId">Azure Active Directory id of the user.</param>
        /// <param name="servicePath">Service URL for a tenant.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        Task AddUserDetailAsync(string userConversationId, string userAadObjectId, string servicePath);

        /// <summary>
        /// Get user details.
        /// </summary>
        /// <param name="userAadObjectId">Azure Active Directory id of the user.</param>
        /// <returns>A task that represents an object to hold user data.</returns>
        Task<UserDetailEntity> GetUserDetailsAsync(string userAadObjectId);
    }
}
