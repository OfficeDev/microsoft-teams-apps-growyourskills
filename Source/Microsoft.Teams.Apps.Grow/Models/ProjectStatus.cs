// <copyright file="ProjectStatus.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    /// <summary>
    /// Valid project status types.
    /// </summary>
    public enum ProjectStatus
    {
        /// <summary>
        /// No status.
        /// </summary>
        None = 0,

        /// <summary>
        /// Project not yet started.
        /// </summary>
        NotStarted = 1,

        /// <summary>
        /// Project is active.
        /// </summary>
        Active = 2,

        /// <summary>
        /// Project is blocked.
        /// </summary>
        Blocked = 3,

        /// <summary>
        /// Project is closed.
        /// </summary>
        Closed = 4,
    }
}
