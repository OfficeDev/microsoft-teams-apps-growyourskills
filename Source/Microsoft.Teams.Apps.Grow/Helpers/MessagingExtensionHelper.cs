// <copyright file="MessagingExtensionHelper.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading.Tasks;
    using System.Web;
    using AdaptiveCards;
    using Microsoft.Bot.Schema;
    using Microsoft.Bot.Schema.Teams;
    using Microsoft.Extensions.Localization;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Common;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;
    using Microsoft.Teams.Apps.Grow.Models.Card;
    using Newtonsoft.Json;

    /// <summary>
    /// Class that handles the search activities for Messaging Extension.
    /// </summary>
    public class MessagingExtensionHelper : IMessagingExtensionHelper
    {
        /// <summary>
        /// Sets the height of the image in pixel.
        /// </summary>
        private const int ImageHeight = 9;

        /// <summary>
        /// Sets the width of the image in pixel.
        /// </summary>
        private const int ImageWidth = 9;

        /// <summary>
        /// Sets the maximum number of characters for owner name.
        /// </summary>
        private const int CreatedByNameMaximumLength = 25;

        /// <summary>
        /// Sets the maximum number of characters for project title.
        /// </summary>
        private const int TitleMaximumLength = 35;

        /// <summary>
        /// Sets the maximum number of characters for owner name.
        /// </summary>
        private const int CreatedByNameSubstringLength = 24;

        /// <summary>
        /// Date time format to support adaptive card text feature.
        /// </summary>
        /// <remarks>
        /// refer adaptive card text feature https://docs.microsoft.com/en-us/adaptive-cards/authoring-cards/text-features#datetime-formatting-and-localization
        /// </remarks>
        private const string Rfc3339DateTimeFormat = "yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'";

        /// <summary>
        /// Search text parameter name in the manifest file.
        /// </summary>
        private const string SearchTextParameterName = "searchText";

        /// <summary>
        /// Search service instance to fetch projects based in search and filter criteria.
        /// </summary>
        private readonly IProjectSearchService projectSearchService;

        /// <summary>
        /// The current cultures' string localizer.
        /// </summary>
        private readonly IStringLocalizer<Strings> localizer;

        /// <summary>
        /// A set of key/value application configuration properties for Activity settings.
        /// </summary>
        private readonly IOptions<BotSettings> options;

        /// <summary>
        /// Instance of project helper.
        /// </summary>
        private readonly IProjectHelper projectHelper;

        /// <summary>
        /// Instance of project status helper.
        /// </summary>
        private readonly ProjectStatusHelper projectStatusHelper;

        /// <summary>
        /// Initializes a new instance of the <see cref="MessagingExtensionHelper"/> class.
        /// </summary>
        /// <param name="localizer">The current cultures' string localizer.</param>
        /// <param name="projectSearchService">Search service instance to fetch projects based in search and filter criteria.</param>
        /// <param name="options">>A set of key/value application configuration properties for activity handler.</param>
        /// <param name="projectHelper">Project helper dependency injection.</param>
        /// <param name="projectStatusHelper">Instance of project status helper.</param>
        public MessagingExtensionHelper(
            IStringLocalizer<Strings> localizer,
            IProjectSearchService projectSearchService,
            IOptions<BotSettings> options,
            IProjectHelper projectHelper,
            ProjectStatusHelper projectStatusHelper)
        {
            this.localizer = localizer;
            this.projectSearchService = projectSearchService;
            this.options = options ?? throw new ArgumentNullException(nameof(options));
            this.projectStatusHelper = projectStatusHelper;
            this.projectHelper = projectHelper;
        }

        /// <summary>
        /// Get the results from Azure Search service and populate the result (card + preview).
        /// </summary>
        /// <param name="query">Query which the user had typed in Messaging Extension search field.</param>
        /// <param name="commandId">Command id to determine which tab in Messaging Extension has been invoked.</param>
        /// <param name="userObjectId">Azure Active Directory id of the user.</param>
        /// <param name="count">Number of search results to return.</param>
        /// <param name="skip">Number of search results to skip.</param>
        /// <returns><see cref="Task"/>Returns Messaging Extension result object, which will be used for providing the card.</returns>
        public async Task<MessagingExtensionResult> GetProjectSearchResultAsync(
            string query,
            string commandId,
            string userObjectId,
            int? count,
            int? skip)
        {
            MessagingExtensionResult composeExtensionResult = new MessagingExtensionResult
            {
                Type = "result",
                AttachmentLayout = AttachmentLayoutTypes.List,
                Attachments = new List<MessagingExtensionAttachment>(),
            };

            IEnumerable<ProjectEntity> projectResults;

            // commandId should be equal to Id mentioned in Manifest file under composeExtensions section.
            switch (commandId)
            {
                case Constants.AllProjectsCommandId:
                    projectResults = await this.projectSearchService.GetProjectsAsync(
                        ProjectSearchScope.AllProjects,
                        query,
                        userObjectId,
                        count,
                        skip);

                    composeExtensionResult = this.GetProjectResult(projectResults);
                    break;

                case Constants.JoinedProjectsCommandId:
                    projectResults = await this.projectSearchService.GetProjectsAsync(
                        ProjectSearchScope.JoinedProjects,
                        userObjectId,
                        userObjectId,
                        count,
                        skip);

                    var filteredProjects = this.projectHelper.GetFilteredProjectsJoinedByUser(projectResults, userObjectId);
                    composeExtensionResult = this.GetProjectResult(filteredProjects);
                    break;

                case Constants.CreatedProjectsCommandId:
                    projectResults = await this.projectSearchService.GetProjectsAsync(
                        ProjectSearchScope.CreatedProjectsByUser,
                        query,
                        userObjectId,
                        count,
                        skip);

                    composeExtensionResult = this.GetProjectResult(projectResults);
                    break;
            }

            return composeExtensionResult;
        }

        /// <summary>
        /// Get the value of the searchText parameter in the Messaging Extension query.
        /// </summary>
        /// <param name="query">Contains Messaging Extension query keywords.</param>
        /// <returns>A value of the searchText parameter.</returns>
        public string GetSearchQueryString(MessagingExtensionQuery query)
        {
            return query?.Parameters.FirstOrDefault(parameter => parameter.Name.Equals(SearchTextParameterName, StringComparison.OrdinalIgnoreCase))?.Value?.ToString();
        }

        /// <summary>
        /// Get projects result for Messaging Extension.
        /// </summary>
        /// <param name="projectsResults">List of user search result.</param>
        /// <returns><see cref="Task"/>Returns Messaging Extension result object, which will be used for providing the card.</returns>
        private MessagingExtensionResult GetProjectResult(IEnumerable<ProjectEntity> projectsResults)
        {
            MessagingExtensionResult composeExtensionResult = new MessagingExtensionResult
            {
                Type = "result",
                AttachmentLayout = AttachmentLayoutTypes.List,
                Attachments = new List<MessagingExtensionAttachment>(),
            };

            if (projectsResults == null)
            {
                return composeExtensionResult;
            }

            foreach (var project in projectsResults)
            {
                var status = this.projectStatusHelper.GetStatus(project.Status);

                var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 2))
                {
                    Body = new List<AdaptiveElement>
                    {
                        new AdaptiveTextBlock
                        {
                            Text = project.Title,
                            Wrap = true,
                            Weight = AdaptiveTextWeight.Bolder,
                        },
                        new AdaptiveTextBlock
                        {
                            Text = project.Description,
                            Wrap = true,
                        },
                    },
                };

                card.Body.Add(this.GetAuthorContainer(project));
                card.Body.Add(this.GetProjectContainer(project));
                card.Body.Add(this.GetAcquiredSkillsContainer(project));

                // Messaging Extension card view details button action.
                card.Actions.Add(
                    new AdaptiveSubmitAction
                    {
                        Title = this.localizer.GetString("MessagingExtensionCardViewProjectDetailButtonText"),
                        Data = new AdaptiveSubmitActionData
                        {
                            Msteams = new TaskModuleAction(Constants.ViewProjectDetail, JsonConvert.SerializeObject(new AdaptiveTaskModuleCardAction { Text = Constants.ViewProjectDetail, ProjectId = project.ProjectId, CreatedByUserId = project.CreatedByUserId })),
                        },
                    });

                var projectStatusIcon = $"<img src='{this.options.Value.AppBaseUri}/Artifacts/{status.IconName}' alt={this.localizer.GetString("ProjectStatusIcon")} width='12px' height='12px'>";
                var nameString = project.CreatedByName.Length < CreatedByNameMaximumLength ? HttpUtility.HtmlEncode(project.CreatedByName) :
                   $"{HttpUtility.HtmlEncode(project.CreatedByName.Substring(0, CreatedByNameSubstringLength))}...";
                var titleString = project.Title.Length < TitleMaximumLength ? HttpUtility.HtmlEncode(project.Title) :
                    $"{HttpUtility.HtmlEncode(project.Title.Substring(0, TitleMaximumLength))}...";

                ThumbnailCard previewCard = new ThumbnailCard
                {
                    Title = $"<p style='font-weight: 600;' title='{project.Title}'>{titleString}</p>",
                    Text = $"{nameString} | {projectStatusIcon} {this.projectStatusHelper.GetStatus(project.Status).StatusName}",
                };

                composeExtensionResult.Attachments.Add(new Attachment
                {
                    ContentType = AdaptiveCard.ContentType,
                    Content = card,
                }.ToMessagingExtensionAttachment(previewCard.ToAttachment()));
            }

            return composeExtensionResult;
        }

        /// <summary>
        /// Get container for project.
        /// </summary>
        /// <param name="projectEntity">Project entity object.</param>
        /// <returns>Return a container for project.</returns>
        private AdaptiveContainer GetProjectContainer(ProjectEntity projectEntity)
        {
            var status = this.projectStatusHelper.GetStatus(projectEntity.Status);

            var formattedProjectStartDateTime = projectEntity.ProjectStartDate.ToString(Rfc3339DateTimeFormat, CultureInfo.InvariantCulture);
            string projectStartDateString = string.Format(CultureInfo.InvariantCulture, this.localizer.GetString("DateFormat"), "{{DATE(" + formattedProjectStartDateTime + ", COMPACT)}}", "{{TIME(" + formattedProjectStartDateTime + ")}}");

            var formattedProjectEndDateTime = projectEntity.ProjectEndDate.ToString(Rfc3339DateTimeFormat, CultureInfo.InvariantCulture);
            string projectEndDateString = string.Format(CultureInfo.InvariantCulture, this.localizer.GetString("DateFormat"), "{{DATE(" + formattedProjectEndDateTime + ", COMPACT)}}", "{{TIME(" + formattedProjectEndDateTime + ")}}");

            var projectContainer = new AdaptiveContainer
            {
                Items = new List<AdaptiveElement>
                {
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Stretch,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"**{this.localizer.GetString("ProjectDurationText")}{":"}**  {projectStartDateString} - {projectEndDateString}",
                                        Wrap = true,
                                    },
                                },
                            },
                        },
                    },
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Auto,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"**{this.localizer.GetString("StatusLabel")}:** ",
                                    },
                                },
                            },
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Auto,
                                VerticalContentAlignment = AdaptiveVerticalContentAlignment.Center,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveImage
                                    {
                                        Url = new Uri($"{this.options.Value.AppBaseUri}/Artifacts/{status.IconName}"),
                                        PixelHeight = ImageHeight,
                                        PixelWidth = ImageWidth,
                                        Style = AdaptiveImageStyle.Default,
                                        Height = AdaptiveHeight.Auto,
                                        HorizontalAlignment = AdaptiveHorizontalAlignment.Right,
                                    },
                                },
                                Spacing = AdaptiveSpacing.Small,
                            },
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Stretch,
                                VerticalContentAlignment = AdaptiveVerticalContentAlignment.Top,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $" {status.StatusName}",
                                        Spacing = AdaptiveSpacing.Small,
                                        IsSubtle = true,
                                        Wrap = true,
                                        Weight = AdaptiveTextWeight.Bolder,
                                    },
                                },
                                Spacing = AdaptiveSpacing.Small,
                            },
                        },
                    },
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Stretch,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"**{this.localizer.GetString("TeamSizeText")}{":"}** {projectEntity.TeamSize}",
                                        Wrap = true,
                                    },
                                },
                            },
                        },
                    },
                },
            };

            return projectContainer;
        }

        /// <summary>
        /// Get container for author.
        /// </summary>
        /// <param name="projectEntity">Project entity object.</param>
        /// <returns>Return a container for author to show.</returns>
        private AdaptiveContainer GetAuthorContainer(ProjectEntity projectEntity)
        {
            string applicationBasePath = this.options.Value.AppBaseUri;

            var authorContainer = new AdaptiveContainer
            {
                Items = new List<AdaptiveElement>
                {
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Auto,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"**{this.localizer.GetString("AuthorText")}{":"}**",
                                        Wrap = true,
                                    },
                                },
                                Spacing = AdaptiveSpacing.Medium,
                            },
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Auto,
                                VerticalContentAlignment = AdaptiveVerticalContentAlignment.Center,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveImage
                                    {
                                        Url = new Uri($"{applicationBasePath}/Artifacts/peopleAvatar.png"),
                                        Size = AdaptiveImageSize.Auto,
                                        Style = AdaptiveImageStyle.Person,
                                        AltText = "User Image",
                                    },
                                },
                                Spacing = AdaptiveSpacing.Small,
                            },
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Auto,
                                VerticalContentAlignment = AdaptiveVerticalContentAlignment.Center,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = projectEntity.CreatedByName.Length > 19 ? $"{projectEntity.CreatedByName.Substring(0, 18)}..." : projectEntity.CreatedByName,
                                        Wrap = true,
                                    },
                                },
                                Spacing = AdaptiveSpacing.Small,
                            },
                        },
                    },
                },
            };

            return authorContainer;
        }

        /// <summary>
        /// Get skills container for project.
        /// </summary>
        /// <param name="projectEntity">Project entity object.</param>
        /// <returns>Return a container for project skills.</returns>
        private AdaptiveContainer GetAcquiredSkillsContainer(ProjectEntity projectEntity)
        {
            var skillsContainer = new AdaptiveContainer
            {
                Items = new List<AdaptiveElement>
                {
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Stretch,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"**{this.localizer.GetString("SkillsLabelText")}{":"}**  {projectEntity.RequiredSkills?.Replace(";", ", ", false, CultureInfo.InvariantCulture)}",
                                        Wrap = true,
                                    },
                                },
                            },
                        },
                    },
                },
            };

            return skillsContainer;
        }
    }
}
