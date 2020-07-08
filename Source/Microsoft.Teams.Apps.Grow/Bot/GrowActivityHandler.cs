// <copyright file="GrowActivityHandler.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Bot
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.ApplicationInsights;
    using Microsoft.ApplicationInsights.DataContracts;
    using Microsoft.Bot.Builder;
    using Microsoft.Bot.Builder.Teams;
    using Microsoft.Bot.Schema;
    using Microsoft.Bot.Schema.Teams;
    using Microsoft.CodeAnalysis;
    using Microsoft.Extensions.Localization;
    using Microsoft.Extensions.Logging;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Cards;
    using Microsoft.Teams.Apps.Grow.Common;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Helpers;
    using Microsoft.Teams.Apps.Grow.Models;
    using Newtonsoft.Json;

    /// <summary>
    /// This class is responsible for reacting to incoming events from Microsoft Teams sent from BotFramework.
    /// </summary>
    public sealed class GrowActivityHandler : TeamsActivityHandler
    {
        /// <summary>
        /// Sets the height of the join project task module.
        /// </summary>
        private const int JoinProjectTaskModuleHeight = 500;

        /// <summary>
        /// Sets the width of the join project task module.
        /// </summary>
        private const int JoinProjectTaskModuleWidth = 600;

        /// <summary>
        /// Represents the join project command for join project task module.
        /// </summary>
        private const string JoinProjectCommand = "joinproject";

        /// <summary>
        /// State management object for maintaining user conversation state.
        /// </summary>
        private readonly BotState userState;

        /// <summary>
        /// A set of key/value application configuration properties for Activity settings.
        /// </summary>
        private readonly IOptions<BotSettings> botOptions;

        /// <summary>
        /// Logger implementation to send logs to the logger service.
        /// </summary>
        private readonly ILogger<GrowActivityHandler> logger;

        /// <summary>
        /// The current cultures' string localizer.
        /// </summary>
        private readonly IStringLocalizer<Strings> localizer;

        /// <summary>
        /// Instance of Application Insights Telemetry client.
        /// </summary>
        private readonly TelemetryClient telemetryClient;

        /// <summary>
        /// Helper to send cards and display projects in messaging extension.
        /// </summary>
        private readonly IMessagingExtensionHelper messagingExtensionHelper;

        /// <summary>
        /// Instance to work with user data.
        /// </summary>
        private readonly IUserDetailProvider userDetailProvider;

        /// <summary>
        /// Instance of team skill storage provider.
        /// </summary>
        private readonly ITeamSkillStorageProvider teamSkillStorageProvider;

        /// <summary>
        /// Instance of project storage provider.
        /// </summary>
        private readonly IProjectStorageProvider projectStorageProvider;

        /// <summary>
        /// Search service helper to fetch projects based on filters and search criteria.
        /// </summary>
        private readonly IProjectSearchService projectSearchService;

        /// <summary>
        /// Instance to send notifications to users.
        /// </summary>
        private readonly NotificationHelper notificationHelper;

        /// <summary>
        /// Provider for fetching information about team details from storage table.
        /// </summary>
        private readonly ITeamStorageProvider teamStorageProvider;

        /// <summary>
        /// Initializes a new instance of the <see cref="GrowActivityHandler"/> class.
        /// </summary>
        /// <param name="logger">Logger implementation to send logs to the logger service.</param>
        /// <param name="localizer">The current cultures' string localizer.</param>
        /// <param name="telemetryClient">The Application Insights telemetry client.</param>
        /// <param name="messagingExtensionHelper">Helper to send cards and display projects in messaging extension.</param>
        /// <param name="userState">State management object for maintaining user conversation state.</param>
        /// <param name="userDetailProvider">Provider instance to work with user data.</param>
        /// <param name="botOptions">A set of key/value application configuration properties for activity handler.</param>
        /// <param name="teamSkillStorageProvider">Team skill storage provider dependency injection.</param>
        /// <param name="projectStorageProvider">Project storage provider dependency injection.</param>
        /// <param name="projectSearchService">Search service helper to fetch projects based on filters and search criteria.</param>
        /// <param name="notificationHelper">Instance to send notifications to users.</param>
        /// <param name="teamStorageProvider">Provider for fetching information about team details from storage table.</param>
        public GrowActivityHandler(
            ILogger<GrowActivityHandler> logger,
            IStringLocalizer<Strings> localizer,
            TelemetryClient telemetryClient,
            IMessagingExtensionHelper messagingExtensionHelper,
            UserState userState,
            IUserDetailProvider userDetailProvider,
            IOptions<BotSettings> botOptions,
            ITeamSkillStorageProvider teamSkillStorageProvider,
            IProjectStorageProvider projectStorageProvider,
            IProjectSearchService projectSearchService,
            NotificationHelper notificationHelper,
            ITeamStorageProvider teamStorageProvider)
        {
            this.logger = logger;
            this.localizer = localizer;
            this.telemetryClient = telemetryClient;
            this.messagingExtensionHelper = messagingExtensionHelper;
            this.userState = userState;
            this.userDetailProvider = userDetailProvider;
            this.botOptions = botOptions ?? throw new ArgumentNullException(nameof(botOptions));
            this.teamSkillStorageProvider = teamSkillStorageProvider;
            this.projectStorageProvider = projectStorageProvider;
            this.projectSearchService = projectSearchService;
            this.notificationHelper = notificationHelper;
            this.teamStorageProvider = teamStorageProvider;
        }

        /// <summary>
        /// Handles an incoming activity.
        /// </summary>
        /// <param name="turnContext">Context object containing information cached for a single turn of conversation with a user.</param>
        /// <param name="cancellationToken">Propagates notification that operations should be canceled.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// Reference link: https://docs.microsoft.com/en-us/dotnet/api/microsoft.bot.builder.activityhandler.onturnasync?view=botbuilder-dotnet-stable.
        /// </remarks>
        public override Task OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));
            this.RecordEvent(nameof(this.OnTurnAsync), turnContext);

            return base.OnTurnAsync(turnContext, cancellationToken);
        }

        /// <summary>
        /// Invoked when members other than this bot (like a user) are removed from the conversation.
        /// </summary>
        /// <param name="turnContext">Context object containing information cached for a single turn of conversation with a user.</param>
        /// <param name="cancellationToken">Propagates notification that operations should be canceled.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected override async Task OnConversationUpdateActivityAsync(ITurnContext<IConversationUpdateActivity> turnContext, CancellationToken cancellationToken)
        {
            turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));

            this.RecordEvent(nameof(this.OnConversationUpdateActivityAsync), turnContext);

            var activity = turnContext.Activity;
            this.logger.LogInformation($"conversationType: {activity.Conversation.ConversationType}, membersAdded: {activity.MembersAdded?.Count}, membersRemoved: {activity.MembersRemoved?.Count}");

            if (activity.Conversation.ConversationType == ConversationTypes.Personal)
            {
                if (activity.MembersAdded != null && activity.MembersAdded.Any(member => member.Id == activity.Recipient.Id))
                {
                    await this.HandleMemberAddedinPersonalScopeAsync(turnContext);
                }
            }
            else if (activity.Conversation.ConversationType == ConversationTypes.Channel)
            {
                if (activity.MembersAdded != null && activity.MembersAdded.Any(member => member.Id == activity.Recipient.Id))
                {
                    await this.HandleMemberAddedInTeamAsync(turnContext);
                }
                else if (activity.MembersRemoved != null && activity.MembersRemoved.Any(member => member.Id == activity.Recipient.Id))
                {
                    await this.HandleMemberRemovedInTeamScopeAsync(turnContext);
                }
            }
        }

        /// <summary>
        /// Invoked when the user opens the Messaging Extension or searching any content in it.
        /// </summary>
        /// <param name="turnContext">Context object containing information cached for a single turn of conversation with a user.</param>
        /// <param name="query">Contains Messaging Extension query keywords.</param>
        /// <param name="cancellationToken">Propagates notification that operations should be canceled.</param>
        /// <returns>Messaging extension response object to fill compose extension section.</returns>
        /// <remarks>
        /// https://docs.microsoft.com/en-us/dotnet/api/microsoft.bot.builder.teams.teamsactivityhandler.onteamsmessagingextensionqueryasync?view=botbuilder-dotnet-stable.
        /// </remarks>
        protected override async Task<MessagingExtensionResponse> OnTeamsMessagingExtensionQueryAsync(
            ITurnContext<IInvokeActivity> turnContext,
            MessagingExtensionQuery query,
            CancellationToken cancellationToken)
        {
            turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));
            this.RecordEvent(nameof(this.OnTeamsMessagingExtensionQueryAsync), turnContext);

            var activity = turnContext.Activity;

            try
            {
                var messagingExtensionQuery = JsonConvert.DeserializeObject<MessagingExtensionQuery>(activity.Value.ToString());
                var searchQuery = this.messagingExtensionHelper.GetSearchQueryString(messagingExtensionQuery);

                return new MessagingExtensionResponse
                {
                    ComposeExtension = await this.messagingExtensionHelper.GetProjectSearchResultAsync(searchQuery, messagingExtensionQuery.CommandId, activity.From.AadObjectId, messagingExtensionQuery.QueryOptions.Count, messagingExtensionQuery.QueryOptions.Skip),
                };
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, $"Failed to handle the Messaging Extension command {activity.Name}: {ex.Message}", SeverityLevel.Error);
                throw;
            }
        }

        /// <summary>
        /// Invoked when task module fetch event is received from the bot.
        /// </summary>
        /// <param name="turnContext">Context object containing information cached for a single turn of conversation with a user.</param>
        /// <param name="taskModuleRequest">Task module invoke request value payload.</param>
        /// <param name="cancellationToken">Propagates notification that operations should be canceled.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
#pragma warning disable CS1998 // Overriding bot method
        protected override async Task<TaskModuleResponse> OnTeamsTaskModuleFetchAsync(
            ITurnContext<IInvokeActivity> turnContext,
            TaskModuleRequest taskModuleRequest,
            CancellationToken cancellationToken)
#pragma warning restore CS1998 // Overriding bot method
        {
            try
            {
                turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));
                taskModuleRequest = taskModuleRequest ?? throw new ArgumentNullException(nameof(taskModuleRequest));

                this.RecordEvent(nameof(this.OnTeamsTaskModuleFetchAsync), turnContext);

                var activity = turnContext.Activity;
                var postedValues = JsonConvert.DeserializeObject<BotCommand>(taskModuleRequest.Data.ToString());
                var command = postedValues.Text;

                switch (command.ToUpperInvariant())
                {
                    case Constants.ViewProjectDetail: // Messaging Extension attachment card view project details button.
                        return new TaskModuleResponse
                        {
                            Task = new TaskModuleContinueResponse
                            {
                                Type = "continue",
                                Value = new TaskModuleTaskInfo()
                                {
                                    Url = $"{this.botOptions.Value.AppBaseUri}/join-project?projectId={postedValues.ProjectId}&currentUserId={activity.From.AadObjectId}&createdByUserId={postedValues.CreatedByUserId}",
                                    Height = JoinProjectTaskModuleHeight,
                                    Width = JoinProjectTaskModuleWidth,
                                    Title = this.localizer.GetString("ApplicationName"),
                                },
                            },
                        };

                    default:
                        return null;
                }
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Error while fetching task module received by the bot.");
                throw;
            }
        }

        /// <summary>
        /// Invoked when a message activity is received from the bot.
        /// </summary>
        /// <param name="turnContext">Context object containing information cached for a single turn of conversation with a user.</param>
        /// <param name="cancellationToken">Propagates notification that operations should be canceled.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            try
            {
                turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));
                var message = turnContext.Activity;

                if (message != null && !string.IsNullOrEmpty(message.Text))
                {
                    var command = message.RemoveRecipientMention()?.Trim();

                    switch (command?.ToUpperInvariant())
                    {
                        case Constants.HelpCommand: // Help command to get the information about the bot.
                            this.logger.LogInformation("Sending user help card");
                            var userHelpCards = CarouselCard.GetUserHelpCards(this.botOptions.Value.AppBaseUri);
                            await turnContext.SendActivityAsync(MessageFactory.Carousel(userHelpCards));
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Error while message activity is received from the bot.");
                throw;
            }
        }

        /// <summary>
        /// When OnTurn method receives a submit invoke activity on bot turn, it calls this method.
        /// </summary>
        /// <param name="turnContext">Provides context for a turn of a bot.</param>
        /// <param name="taskModuleRequest">Task module invoke request value payload.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents a task module response.</returns>
        protected override async Task<TaskModuleResponse> OnTeamsTaskModuleSubmitAsync(
            ITurnContext<IInvokeActivity> turnContext,
            TaskModuleRequest taskModuleRequest,
            CancellationToken cancellationToken)
        {
            try
            {
                // Join project action and other task module events.
                turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));
                taskModuleRequest = taskModuleRequest ?? throw new ArgumentNullException(nameof(taskModuleRequest));

                var joinProjectData = JsonConvert.DeserializeObject<JoinProject>(taskModuleRequest.Data?.ToString());

                if (joinProjectData == null)
                {
                    this.logger.LogInformation($"Request data obtained on task module submit action is null.");
                    return this.GetErrorResponse();
                }

                if (joinProjectData.Command == JoinProjectCommand)
                {
                    var currentUser = turnContext.Activity.From;

                    // Save the joined project in UserJoinedProject Entity.
                    this.logger.LogInformation("call to add project in user's joined project list.");

                    if (string.IsNullOrEmpty(joinProjectData.ProjectDetails?.ProjectId))
                    {
                        this.logger.LogError("Error while adding a project in user's joined project list.");
                        return this.GetErrorResponse();
                    }

                    // Get project details.
                    var projectDetails = await this.projectStorageProvider.GetProjectAsync(joinProjectData.ProjectDetails.CreatedByUserId, joinProjectData.ProjectDetails.ProjectId);

                    // Allow user to join project which has status 'Active' and 'Not started'.
                    if (projectDetails != null && !projectDetails.IsRemoved && (projectDetails.Status == (int)ProjectStatus.NotStarted || projectDetails.Status == (int)ProjectStatus.Active))
                    {
                        // If there no existing participants
                        if (string.IsNullOrEmpty(projectDetails.ProjectParticipantsUserIds))
                        {
                            projectDetails.ProjectParticipantsUserIds = currentUser.AadObjectId;
                            projectDetails.ProjectParticipantsUserMapping = $"{currentUser.AadObjectId}:{currentUser.Name}";
                        }
                        else
                        {
                            // Get number of people who already joined the project.
                            var joinedUsers = projectDetails.ProjectParticipantsUserIds.Split(';').Where(participant => !string.IsNullOrEmpty(participant));

                            // Check if user's joined project count is reached to maximum team size.
                            if (projectDetails.TeamSize == joinedUsers.Count())
                            {
                                this.logger.LogError($"Project max member count reached for {projectDetails.ProjectId}.");
                                return this.GetErrorResponse();
                            }

                            // If user has already joined project, return error response
                            if (joinedUsers.Contains(currentUser.AadObjectId))
                            {
                                this.logger.LogError($"User {currentUser.AadObjectId} has already joined project {projectDetails.ProjectId}.");
                                return this.GetErrorResponse();
                            }

                            projectDetails.ProjectParticipantsUserIds += $";{currentUser.AadObjectId}";
                            projectDetails.ProjectParticipantsUserMapping += $";{currentUser.AadObjectId}:{currentUser.Name}";
                        }

                        // Update the project status.
                        var isUpdated = await this.projectStorageProvider.UpsertProjectAsync(projectDetails);

                        if (isUpdated)
                        {
                            await this.projectSearchService.RunIndexerOnDemandAsync();
                            this.logger.LogInformation($"User joined project: {joinProjectData.ProjectDetails.ProjectId} successfully updated.");
                        }
                        else
                        {
                            this.logger.LogInformation($"Error while updating the project: {joinProjectData.ProjectDetails.ProjectId} details.");
                            return this.GetErrorResponse();
                        }

                        // Send Notification to owner when any user joins project.
                        await this.notificationHelper.SendProjectJoinedNotificationAsync(
                                    projectDetails,
                                    turnContext.Activity.From.Name,
                                    joinProjectData.Upn);

                        this.RecordEvent("User joined project - HTTP Post call succeeded", turnContext);

                        return new TaskModuleResponse
                        {
                            Task = new TaskModuleContinueResponse
                            {
                                Type = "continue",
                                Value = new TaskModuleTaskInfo()
                                {
                                    Url = $"{this.botOptions.Value.AppBaseUri}/join-project-success",
                                    Height = JoinProjectTaskModuleHeight,
                                    Width = JoinProjectTaskModuleWidth,
                                    Title = this.localizer.GetString("ApplicationName"),
                                },
                            },
                        };
                    }

                    return this.GetErrorResponse();
                }

                return null;
            }
#pragma warning disable CA1031 // Caching general exception to respond user with error page in Task Module.
            catch (Exception ex)
#pragma warning restore CA1031 // Caching general exception to respond user with error page in Task Module.
            {
                this.logger.LogError(ex, "Error in submit action of task module.");
                return this.GetErrorResponse();
            }
        }

        /// <summary>
        /// Records event data to Application Insights telemetry client
        /// </summary>
        /// <param name="eventName">Name of the event.</param>
        /// <param name="turnContext">Provides context for a turn in a bot.</param>
        private void RecordEvent(string eventName, ITurnContext turnContext)
        {
            var teamsChannelData = turnContext.Activity.GetChannelData<TeamsChannelData>();

            this.telemetryClient.TrackEvent(eventName, new Dictionary<string, string>
            {
                { "userId", turnContext.Activity.From.AadObjectId },
                { "tenantId", turnContext.Activity.Conversation.TenantId },
                { "teamId", teamsChannelData?.Team?.Id },
                { "channelId", teamsChannelData?.Channel?.Id },
            });
        }

        /// <summary>
        /// Get error page response to be displayed in task module.
        /// </summary>
        /// <returns>Task module response object for error.</returns>
        private TaskModuleResponse GetErrorResponse()
        {
            return new TaskModuleResponse
            {
                Task = new TaskModuleContinueResponse
                {
                    Type = "continue",
                    Value = new TaskModuleTaskInfo()
                    {
                        Url = $"{this.botOptions.Value.AppBaseUri}/error",
                        Height = JoinProjectTaskModuleHeight,
                        Width = JoinProjectTaskModuleWidth,
                        Title = this.localizer.GetString("ApplicationName"),
                    },
                },
            };
        }

        /// <summary>
        /// Sent welcome card to personal chat.
        /// </summary>
        /// <param name="turnContext">Provides context for a turn in a bot.</param>
        /// <returns>A task that represents a response.</returns>
        private async Task HandleMemberAddedinPersonalScopeAsync(ITurnContext<IConversationUpdateActivity> turnContext)
        {
            this.logger.LogInformation($"Bot added in personal {turnContext.Activity.Conversation.Id}");

            var userStateAccessors = this.userState.CreateProperty<UserConversationState>(nameof(UserConversationState));
            var userConversationState = await userStateAccessors.GetAsync(turnContext, () => new UserConversationState());

            if (userConversationState.IsWelcomeCardSent)
            {
                return;
            }

            var userWelcomeCardAttachment = WelcomeCard.GetWelcomeCardAttachmentForPersonal(
                this.botOptions.Value.AppBaseUri,
                localizer: this.localizer,
                this.botOptions.Value.ManifestId,
                Constants.DiscoverTabEntityId);

            await turnContext.SendActivityAsync(MessageFactory.Attachment(userWelcomeCardAttachment));

            userConversationState.IsWelcomeCardSent = true;
            await userStateAccessors.SetAsync(turnContext, userConversationState);

            await this.userDetailProvider.AddUserDetailAsync(
                turnContext.Activity.Conversation.Id,
                turnContext.Activity.From.AadObjectId,
                turnContext.Activity.ServiceUrl);
        }

        /// <summary>
        /// Send a welcome card if bot is installed in Team scope.
        /// </summary>
        /// <param name="turnContext">Provides context for a turn in a bot.</param>
        /// <returns>A task that represents a response.</returns>
        private async Task HandleMemberAddedInTeamAsync(ITurnContext<IConversationUpdateActivity> turnContext)
        {
            turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));

            var userWelcomeCardAttachment = WelcomeCard.GetWelcomeCardAttachmentForTeam(this.botOptions.Value.AppBaseUri, localizer: this.localizer);
            await turnContext.SendActivityAsync(MessageFactory.Attachment(userWelcomeCardAttachment));

            var activity = turnContext.Activity;
            this.logger.LogInformation($"Bot added in team {turnContext.Activity.Conversation.Id}");

            // Storing team information to storage
            var teamsDetails = activity.TeamsGetTeamInfo();

            TeamEntity teamEntity = new TeamEntity
            {
                TeamId = teamsDetails.Id,
                BotInstalledOn = DateTime.UtcNow,
                ServiceUrl = activity.ServiceUrl,
            };

            bool operationStatus = await this.teamStorageProvider.UpsertTeamDetailAsync(teamEntity);

            if (!operationStatus)
            {
                this.logger.LogInformation($"Unable to store bot installation state in storage.");
            }
        }

        /// <summary>
        /// Remove user details from storage if bot is uninstalled from Team scope.
        /// </summary>
        /// <param name="turnContext">Provides context for a turn in a bot.</param>
        /// <returns>A task that represents a response.</returns>
        private async Task HandleMemberRemovedInTeamScopeAsync(ITurnContext<IConversationUpdateActivity> turnContext)
        {
            this.logger.LogInformation($"Bot removed from team {turnContext.Activity.Conversation.Id}");
            var teamsChannelData = turnContext.Activity.GetChannelData<TeamsChannelData>();
            var teamId = teamsChannelData.Team.Id;

            // Deleting team information from storage when bot is uninstalled from a team.
            this.logger.LogInformation($"Bot removed {turnContext.Activity.Conversation.Id}");
            var teamEntity = await this.teamStorageProvider.GetTeamDetailAsync(teamId);

            if (teamEntity == null)
            {
                this.logger.LogWarning($"No team is found for team id {teamId} to delete team details");
                return;
            }

            bool deletedTeamDetailsStatus = await this.teamStorageProvider.DeleteTeamDetailAsync(teamEntity);
            if (!deletedTeamDetailsStatus)
            {
                this.logger.LogWarning("Unable to remove team details from Azure storage.");
            }

            bool deletedSkillStatus = await this.teamSkillStorageProvider.DeleteTeamSkillsAsync(teamId);
            if (!deletedSkillStatus)
            {
                this.logger.LogWarning("Unable to remove team skills details from Azure storage.");
            }
        }
    }
}