// <copyright file="IAcquiredSkillStorageProvider.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.Interfaces
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Interface for provider which helps in getting, storing or updating acquired skills details.
    /// </summary>
    public interface IAcquiredSkillStorageProvider
    {
        /// <summary>
        /// Stores or update acquired skill data.
        /// </summary>
        /// <param name="entity">Holds acquired skill detail.</param>
        /// <returns>A task that represents acquired skill is saved or updated.</returns>
        Task<bool> UpsertAcquiredSkillAsync(AcquiredSkillsEntity entity);

        /// <summary>
        /// Get acquired skills of a user.
        /// </summary>
        /// <param name="userId">Azure Active Directory id of user.</param>
        /// <returns>A task that represents a collection of acquired skills.</returns>
        Task<IEnumerable<AcquiredSkillsEntity>> GetAcquiredSkillsAsync(string userId);
    }
}
