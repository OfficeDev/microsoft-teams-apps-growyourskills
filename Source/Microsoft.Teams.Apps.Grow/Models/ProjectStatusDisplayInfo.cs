// <copyright file="ProjectStatusDisplayInfo.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    /// <summary>
    /// Represents status model.
    /// </summary>
    public class ProjectStatusDisplayInfo
    {
        /// <summary>
        /// Gets or sets unique value for each post type.
        /// </summary>
        public int StatusId { get; set; }

        /// <summary>
        /// Gets or sets post type name.
        /// </summary>
        public string StatusName { get; set; }

        /// <summary>
        /// Gets or sets post icon name.
        /// </summary>
        public string IconName { get; set; }
    }
}
