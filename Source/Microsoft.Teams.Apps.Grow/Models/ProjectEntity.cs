// <copyright file="ProjectEntity.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    using System;
    using System.ComponentModel.DataAnnotations;
    using Microsoft.Azure.Search;
    using Microsoft.Teams.Apps.Grow.Helpers.CustomValidations;
    using Microsoft.WindowsAzure.Storage.Table;

    /// <summary>
    /// Class that represents a project entity.
    /// It is responsible for storing project details and participants details (User who joined this project)
    /// </summary>
    public class ProjectEntity : TableEntity
    {
        /// <summary>
        /// Gets or sets Azure Active Directory id of user who created the project.
        /// </summary>
        [IsFilterable]
        public string CreatedByUserId
        {
            get { return this.PartitionKey; }
            set { this.PartitionKey = value; }
        }

        /// <summary>
        /// Gets or sets unique identifier for each created project.
        /// </summary>
        [Key]
        public string ProjectId
        {
            get { return this.RowKey; }
            set { this.RowKey = value; }
        }

        /// <summary>
        /// Gets or sets status of project like: Not started/Active/Blocked/Closed.
        /// </summary>
        [IsFilterable]
        [Required]
        public int Status { get; set; }

        /// <summary>
        /// Gets or sets title of project.
        /// </summary>
        [IsSearchable]
        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets description of project.
        /// </summary>
        [IsSearchable]
        [Required]
        [MinLength(200)]
        [MaxLength(400)]
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets URL's of the supported documents.
        /// </summary>
        [DocumentLinksValidation(3, 400)]
        public string SupportDocuments { get; set; }

        /// <summary>
        /// Gets or sets semicolon separated skills entered by user for a project.
        /// </summary>
        [IsSearchable]
        [IsFilterable]
        [ProjectSkillsValidation(2, 5)]
        public string RequiredSkills { get; set; }

        /// <summary>
        /// Gets or sets start date time of project.
        /// </summary>
        [Required]
        public DateTime ProjectStartDate { get; set; }

        /// <summary>
        /// Gets or sets end date time of project.
        /// </summary>
        [Required]
        public DateTime ProjectEndDate { get; set; }

        /// <summary>
        /// Gets or sets date time when project is created.
        /// </summary>
        [IsSortable]
        public DateTime CreatedDate { get; set; }

        /// <summary>
        /// Gets or sets name of user who created the project.
        /// </summary>
        [IsFilterable]
        public string CreatedByName { get; set; }

        /// <summary>
        /// Gets or sets date time when project details are updated by project owner.
        /// </summary>
        [IsSortable]
        public DateTime UpdatedDate { get; set; }

        /// <summary>
        /// Gets or sets maximum team size of a project.
        /// </summary>
        [Required]
        [Range(1, 20)]
        public int TeamSize { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the project is deleted or not.
        /// </summary>
        [IsFilterable]
        public bool IsRemoved { get; set; }

        /// <summary>
        /// Gets or sets semicolon separated Azure Active Directory id of users who joined a project
        /// to send notification while closing the project.
        /// </summary>
        [IsSearchable]
        public string ProjectParticipantsUserIds { get; set; }

        /// <summary>
        /// Gets or sets Semicolon separated key/value pairs for participants id and
        /// name for a project to display names of participants while closing the project.
        /// </summary>
        public string ProjectParticipantsUserMapping { get; set; }

        /// <summary>
        /// Gets or sets date time when the project is closed.
        /// </summary>
        public DateTime ProjectClosedDate { get; set; }
    }
}
