// <copyright file="ProjectParticipantModel.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models
{
    using System.ComponentModel.DataAnnotations;
    using Microsoft.Teams.Apps.Grow.Helpers.CustomValidations;

    /// <summary>
    /// Class that represents project participant model.
    /// </summary>
    public class ProjectParticipantModel
    {
        /// <summary>
        /// Gets or sets Azure Active Directory id of participant.
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// Gets or sets name of project participant.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets semicolon separated acquired skills by participant.
        /// </summary>
        [Required]
        [ProjectSkillsValidation(1, 5)]
        public string AcquiredSkills { get; set; }

        /// <summary>
        /// Gets or sets feedback given by project owner to a participant.
        /// </summary>
        [MaxLength(250)]
        public string Feedback { get; set; }
    }
}
