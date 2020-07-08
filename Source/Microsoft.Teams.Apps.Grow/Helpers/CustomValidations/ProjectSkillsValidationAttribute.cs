// <copyright file="ProjectSkillsValidationAttribute.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Helpers.CustomValidations
{
    using System.ComponentModel.DataAnnotations;
    using System.Linq;

    /// <summary>
    /// Validate skill based on length and skill count for project.
    /// </summary>
    public sealed class ProjectSkillsValidationAttribute : ValidationAttribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ProjectSkillsValidationAttribute"/> class.
        /// </summary>
        /// <param name="minimumCount">Minimum count of skills for validation.</param>
        /// <param name="maximumCount">Maximum count of skills for validation.</param>
        /// <param name="maximumLength">Maximum length of skills for validation.</param>
        public ProjectSkillsValidationAttribute(int minimumCount, int maximumCount, int maximumLength = 20)
        {
            this.MinimumCount = minimumCount;
            this.MaximumCount = maximumCount;
            this.MaximumLength = maximumLength;
        }

        /// <summary>
        /// Gets minimum count of skills for validation.
        /// </summary>
        public int MinimumCount { get; }

        /// <summary>
        /// Gets maximum count of skills for validation.
        /// </summary>
        public int MaximumCount { get; }

        /// <summary>
        /// Gets maximum length of skills for validation.
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
            char[] invalidCharacters = new char[]
            {
                '|', '"', '(', ')', '\'', '\\',
            };

            if (value != null && value.GetType() == typeof(string))
            {
                var skills = (string)value;

                if (!string.IsNullOrEmpty(skills))
                {
                    var skillsList = skills.Split(';');

                    if (skillsList.Length < this.MinimumCount || skillsList.Length > this.MaximumCount)
                    {
                        return new ValidationResult("Minimum 2 and Maximum 5 skills can be added.");
                    }

                    foreach (var skill in skillsList)
                    {
                        if (string.IsNullOrWhiteSpace(skill))
                        {
                            return new ValidationResult("Skill cannot be null or empty.");
                        }

                        if (skill.Length > this.MaximumLength)
                        {
                            return new ValidationResult("Maximum skill length exceeded.");
                        }

                        if (skill.ToCharArray().Where(item => invalidCharacters.Contains(item)).Any())
                        {
                            return new ValidationResult("Special characters are not allowed in skill.");
                        }
                    }
                }
            }

            // Skills are mandatory for adding/updating project.
            return ValidationResult.Success;
        }
    }
}
