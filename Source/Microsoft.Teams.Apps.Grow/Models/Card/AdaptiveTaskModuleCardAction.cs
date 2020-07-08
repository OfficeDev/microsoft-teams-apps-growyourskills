// <copyright file="AdaptiveTaskModuleCardAction.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Models.Card
{
    using Newtonsoft.Json;

    /// <summary>
    /// Defines model for opening task module.
    /// </summary>
    public class AdaptiveTaskModuleCardAction
    {
        /// <summary>
        /// Gets or sets action type for button.
        /// </summary>
        [JsonProperty("type")]
        public string Type
        {
            get
            {
                return "task/fetch";
            }
            set => this.Type = "task/fetch";
        }

        /// <summary>
        /// Gets or sets bot command to be used by bot for processing user inputs.
        /// </summary>
        [JsonProperty("text")]
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets project id value.
        /// </summary>
        [JsonProperty("projectid")]
        public string ProjectId { get; set; }

        /// <summary>
        /// Gets or sets created by user Id.
        /// </summary>
        [JsonProperty("createdByUserId")]
        public string CreatedByUserId { get; set; }
    }
}
