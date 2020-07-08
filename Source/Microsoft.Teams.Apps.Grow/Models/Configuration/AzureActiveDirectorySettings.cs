// <copyright file="AzureActiveDirectorySettings.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models.Configuration
{
    /// <summary>
    /// Class which will help to provide Azure Active Directlry settings for Grow application.
    /// </summary>
    public class AzureActiveDirectorySettings
    {
        /// <summary>
        /// Gets or sets application tenant id.
        /// </summary>
        public string TenantId { get; set; }

        /// <summary>
        /// Gets or sets client id.
        /// </summary>
        public string ClientId { get; set; }
    }
}
