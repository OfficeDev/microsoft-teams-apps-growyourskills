// <copyright file="ProjectStatusHelper.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Helpers
{
    using Microsoft.Extensions.Localization;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    ///  Class that handles the project status.
    /// </summary>
    public class ProjectStatusHelper
    {
        /// <summary>
        /// The current cultures' string localizer.
        /// </summary>
        private readonly IStringLocalizer<Strings> localizer;

        /// <summary>
        /// Initializes a new instance of the <see cref="ProjectStatusHelper"/> class.
        /// </summary>
        /// <param name="localizer">The current cultures' string localizer.</param>
        public ProjectStatusHelper(IStringLocalizer<Strings> localizer)
        {
            this.localizer = localizer;
        }

        /// <summary>
        /// Get the status using its id.
        /// </summary>
        /// <param name="key">Status id value.</param>
        /// <returns>Returns a localized status from the id value.</returns>
        public ProjectStatusDisplayInfo GetStatus(int key)
        {
            switch (key)
            {
                case (int)ProjectStatus.NotStarted:
                    return new ProjectStatusDisplayInfo { StatusName = this.localizer.GetString("NotStartedStatusType"), IconName = "notStartedStatusDot.png", StatusId = 1 };

                case (int)ProjectStatus.Active:
                    return new ProjectStatusDisplayInfo { StatusName = this.localizer.GetString("ActiveStatusType"), IconName = "activeStatusDot.png", StatusId = 2 };

                case (int)ProjectStatus.Blocked:
                    return new ProjectStatusDisplayInfo { StatusName = this.localizer.GetString("BlockedStatusType"), IconName = "blockedStatusDot.png", StatusId = 3 };

                case (int)ProjectStatus.Closed:
                    return new ProjectStatusDisplayInfo { StatusName = this.localizer.GetString("ClosedStatusType"), IconName = "closedStatusDot.png", StatusId = 4 };

                default:
                    return null;
            }
        }
    }
}
