// <copyright file="CloseProjectModel.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;

    /// <summary>
    /// Class that represents a model for closing project.
    /// </summary>
    public class CloseProjectModel
    {
        /// <summary>
        /// Gets or sets unique identifier for each created project.
        /// </summary>
        [Required]
        public string ProjectId { get; set; }

        /// <summary>
        /// Gets or sets title of project to show on acquired skills tab.
        /// </summary>
        [Required]
        public string ProjectTitle { get; set; }

        /// <summary>
        ///  Gets or sets name of owner who created the project to show on acquired skills tab.
        /// </summary>
        [Required]
        public string ProjectOwnerName { get; set; }

        /// <summary>
        /// Gets or sets project participants list.
        /// </summary>
#pragma warning disable CA2227 // Collection properties should be read only
        public List<ProjectParticipantModel> ProjectParticipantDetails { get; set; }
#pragma warning restore CA2227 // Collection properties should be read only
    }
}
