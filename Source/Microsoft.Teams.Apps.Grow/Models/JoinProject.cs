// <copyright file="JoinProject.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    /// <summary>
    /// Class which holds submitted data of joined project.
    /// </summary>
    public class JoinProject
    {
        /// <summary>
        /// Gets or sets join project model data.
        /// </summary>
        public ProjectEntity ProjectDetails { get; set; }

        /// <summary>
        /// Gets or sets Command to show join a project or submit or cancel event on Task Module.
        /// </summary>
        public string Command { get; set; }

        /// <summary>
        /// Gets or sets user principal name.
        /// </summary>
        public string Upn { get; set; }
    }
}
