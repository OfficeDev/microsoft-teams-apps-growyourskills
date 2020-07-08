// <copyright file="TeamSkillsValidationAttribute.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Helpers.CustomValidations
{
    using System;
    using System.ComponentModel.DataAnnotations;
    using System.Globalization;

    /// <summary>
    /// Validate skills based on length and skill count for post.
    /// </summary>
    public sealed class TeamSkillsValidationAttribute : ValidationAttribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TeamSkillsValidationAttribute"/> class.
        /// </summary>
        /// <param name="maximumCount">Max count of skills for validation.</param>
        /// <param name="maximumLength">Maximum length of a skill for validation.</param>
        public TeamSkillsValidationAttribute(int maximumCount, int maximumLength)
        {
            this.MaximumCount = maximumCount;
            this.MaximumLength = maximumLength;
        }

        /// <summary>
        /// Gets max count of skills for validation.
        /// </summary>
        public int MaximumCount { get; }

        /// <summary>
        /// Gets maximum length of a skill for validation.
        /// </summary>
        public int MaximumLength { get; }

        /// <summary>
        /// Validate skill based on skill length and number of skills separated by comma.
        /// </summary>
        /// <param name="value">String containing skills separated by comma.</param>
        /// <param name="validationContext">Context for getting object which needs to be validated.</param>
        /// <returns>Validation result (either error message for failed validation or success).</returns>
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var skills = Convert.ToString(value, CultureInfo.InvariantCulture);

            if (!string.IsNullOrEmpty(skills))
            {
                var skillsList = skills.Split(';');

                if (skillsList.Length > this.MaximumCount)
                {
                    return new ValidationResult("Max skills count exceeded");
                }

                foreach (var skill in skillsList)
                {
                    if (string.IsNullOrWhiteSpace(skill))
                    {
                        return new ValidationResult("Skill cannot be null or empty");
                    }

                    if (skill.Length > this.MaximumLength)
                    {
                        return new ValidationResult("Max skill length exceeded");
                    }
                }
            }

            // Skills are not mandatory for adding/updating project
            return ValidationResult.Success;
        }
    }
}
