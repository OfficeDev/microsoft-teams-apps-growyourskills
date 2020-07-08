// <copyright file="BotCommand.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    /// <summary>
    /// A class that represents properties to be parsed from activity value.
    /// </summary>
    public class BotCommand
    {
        /// <summary>
        /// Gets or sets bot command text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets project id value.
        /// </summary>
        public string ProjectId { get; set; }

        /// <summary>
        /// Gets or sets created by user Id.
        /// </summary>
        public string CreatedByUserId { get; set; }
    }
}