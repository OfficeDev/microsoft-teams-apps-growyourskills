// <copyright file="Constants.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common
{
    /// <summary>
    /// Class that holds application constants that are used in multiple files.
    /// </summary>
    public static class Constants
    {
        /// <summary>
        /// All items post command id in the manifest file.
        /// </summary>
        public const string AllProjectsCommandId = "allProjects";

        /// <summary>
        ///  Posted by me post command id in the manifest file.
        /// </summary>
        public const string CreatedProjectsCommandId = "createdProjectsByMe";

        /// <summary>
        ///  Popular post command id in the manifest file.
        /// </summary>
        public const string JoinedProjectsCommandId = "joinedProjects";

        /// <summary>
        /// Bot project details command to open task module.
        /// </summary>
        public const string ViewProjectDetail = "VIEWPROJECTDETAILS";

        /// <summary>
        /// Bot Help command in personal scope.
        /// </summary>
        public const string HelpCommand = "HELP";

        /// <summary>
        /// Per page post count for lazy loading (max 50).
        /// </summary>
        public const int LazyLoadPerPageProjectCount = 50;

        /// <summary>
        /// default value for channel activity to send notifications.
        /// </summary>
        public const string TeamsBotFrameworkChannelId = "msteams";

        /// <summary>
        /// Default value for conversation type.
        /// </summary>
        public const string ConversationType = "personal";

        /// <summary>
        /// Describes adaptive card version to be used. Version can be upgraded or changed using this value.
        /// </summary>
        public const string AdaptiveCardVersion = "1.2";

        /// <summary>
        /// Describes all projects tab name.
        /// </summary>
        public const string AllProjectsTabName = "All projects";

        /// <summary>
        /// Describes discover tab entity Id.
        /// </summary>
        public const string DiscoverTabEntityId = "DiscoverProjectsTab";

        /// <summary>
        /// Describes acquired skills tab entity Id.
        /// </summary>
        public const string AcquiredSkillsTabEntityId = "AcquiredSkillsTab";
    }
}
