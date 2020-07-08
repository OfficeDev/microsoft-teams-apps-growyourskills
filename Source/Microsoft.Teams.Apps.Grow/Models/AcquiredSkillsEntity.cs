// <copyright file="AcquiredSkillsEntity.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    using System;
    using System.ComponentModel.DataAnnotations;
    using Microsoft.Teams.Apps.Grow.Helpers.CustomValidations;
    using Microsoft.WindowsAzure.Storage.Table;

    /// <summary>
    /// Class which represents acquired skill entity.
    /// It is responsible for storing acquired skills of participants.
    /// </summary>
    public class AcquiredSkillsEntity : TableEntity
    {
        /// <summary>
        /// Gets or sets Azure Active Directory id of user.
        /// </summary>
        public string UserId
        {
            get { return this.PartitionKey; }
            set { this.PartitionKey = value; }
        }

        /// <summary>
        /// Gets or sets unique identifier for each created project.
        /// </summary>
        public string ProjectId
        {
            get { return this.RowKey; }
            set { this.RowKey = value; }
        }

        /// <summary>
        /// Gets or sets date time when participant acquired the skills.
        /// </summary>
        public DateTime CreatedDate { get; set; }

        /// <summary>
        /// Gets or sets semicolon separated list of acquired skills by participant.
        /// </summary>
        [Required]
        [ProjectSkillsValidation(1, 5)]
        public string AcquiredSkills { get; set; }

        /// <summary>
        /// Gets or sets feedback given by project owner to a participant.
        /// </summary>
        [MaxLength(250)]
        public string Feedback { get; set; }

        /// <summary>
        /// Gets or sets title of project to show on acquired skills tab.
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string ProjectTitle { get; set; }

        /// <summary>
        ///  Gets or sets name of owner who created the project to show on acquired skills tab.
        /// </summary>
        [Required]
        public string ProjectOwnerName { get; set; }

        /// <summary>
        /// Gets or sets date time when a project is closed.
        /// </summary>
        [Required]
        public DateTime ProjectClosedDate { get; set; }
    }
}
