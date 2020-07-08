// <copyright file="DocumentLinksValidationAttribute.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Helpers.CustomValidations
{
    using System.ComponentModel.DataAnnotations;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Validate document links based on length and count for a project.
    /// </summary>
    public sealed class DocumentLinksValidationAttribute : ValidationAttribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="DocumentLinksValidationAttribute"/> class.
        /// </summary>
        /// <param name="maximumCount">Maximum count of document links for validation.</param>
        /// <param name="maximumLength">Maximum length of document link for validation.</param>
        public DocumentLinksValidationAttribute(int maximumCount, int maximumLength)
        {
            this.MaximumCount = maximumCount;
            this.MaximumLength = maximumLength;
        }

        /// <summary>
        /// Gets maximum count of links for validation.
        /// </summary>
        public int MaximumCount { get; }

        /// <summary>
        /// Gets maximum length of document link.
        /// </summary>
        public int MaximumLength { get; }

        /// <summary>
        /// Validate document link based on link length and number of links separated by comma.
        /// </summary>
        /// <param name="value">String containing document links separated by comma.</param>
        /// <param name="validationContext">Context for getting object which needs to be validated.</param>
        /// <returns>Validation result (either error message for failed validation or success).</returns>
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value != null)
            {
                if (value.GetType() == typeof(string))
                {
                    var documentLinks = (string)value;

                    if (!string.IsNullOrEmpty(documentLinks))
                    {
                        var documentLinksList = documentLinks.Split(';');

                        if (documentLinksList.Length > this.MaximumCount)
                        {
                            return new ValidationResult("Maximum document links count exceeded");
                        }

                        foreach (var documentLink in documentLinksList)
                        {
                            if (string.IsNullOrWhiteSpace(documentLink))
                            {
                                return new ValidationResult("Document link cannot be null or empty");
                            }

                            if (documentLink.Length > this.MaximumLength)
                            {
                                return new ValidationResult("Maximum document link length exceeded");
                            }

                            if (!this.IsUrlValid(documentLink))
                            {
                                return new ValidationResult("Document link doesn't match URL format.");
                            }
                        }
                    }

                    return ValidationResult.Success;
                }

                return new ValidationResult("Document link should be in string format.");
            }

            // Document links are not mandatory hence value can be null
            return ValidationResult.Success;
        }

        /// <summary>
        /// Validate document URL using regex pattern matching.
        /// </summary>
        /// <param name="documentUrl">Document URL for project.</param>
        /// <returns>Boolean indicating if URL is valid match.</returns>
        private bool IsUrlValid(string documentUrl)
        {
            string pattern = @"^http(s)?:\/\/(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$";
            Regex reg = new Regex(pattern, RegexOptions.Compiled | RegexOptions.IgnoreCase);
            return reg.IsMatch(documentUrl);
        }
    }
}