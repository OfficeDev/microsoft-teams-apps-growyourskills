// <copyright file="NotificationHelper.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.Bot.Builder;
    using Microsoft.Bot.Builder.Integration.AspNet.Core;
    using Microsoft.Bot.Connector.Authentication;
    using Microsoft.Bot.Schema;
    using Microsoft.Extensions.Localization;
    using Microsoft.Extensions.Logging;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Cards;
    using Microsoft.Teams.Apps.Grow.Common;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;
    using Microsoft.Teams.Apps.Grow.Models.Configuration;
    using Polly;
    using Polly.Contrib.WaitAndRetry;
    using Polly.Retry;

    /// <summary>
    /// Helper class to notify users on various events like project closure, deletion, joining and removal.
    /// </summary>
    public class NotificationHelper
    {
        /// <summary>
        /// Represents retry delay.
        /// </summary>
        private const int RetryDelay = 1000;

        /// <summary>
        /// Represents retry count.
        /// </summary>
        private const int RetryCount = 2;

        /// <summary>
        /// Sends logs to the logger service.
        /// </summary>
        private readonly ILogger logger;

        /// <summary>
        /// Instance of IBot framework HTTP adapter.
        /// </summary>
        private readonly IBotFrameworkHttpAdapter botFrameworkHttpAdapter;

        /// <summary>
        /// A set of key/value application configuration properties.
        /// </summary>
        private readonly IOptions<AzureActiveDirectorySettings> aadOptions;

        /// <summary>
        /// A set of key/value application configuration properties.
        /// </summary>
        private readonly IOptions<BotSettings> botOptions;

        /// <summary>
        /// Instance of user storage provider.
        /// </summary>
        private readonly IUserDetailProvider userDetailProvider;

        /// <summary>
        /// Retry policy with jitter, retry twice with a jitter delay of up to 1 sec. Retry for HTTP 429(transient error)/502 bad gateway.
        /// </summary>
        /// <remarks>
        /// Reference: https://github.com/Polly-Contrib/Polly.Contrib.WaitAndRetry#new-jitter-recommendation.
        /// </remarks>
        private readonly AsyncRetryPolicy retryPolicy = Policy.Handle<ErrorResponseException>(
            ex => ex.Response.StatusCode == HttpStatusCode.TooManyRequests || ex.Response.StatusCode == HttpStatusCode.BadGateway)
            .WaitAndRetryAsync(Backoff.DecorrelatedJitterBackoffV2(TimeSpan.FromMilliseconds(RetryDelay), RetryCount));

        /// <summary>
        /// The current cultures' string localizer.
        /// </summary>
        private readonly IStringLocalizer<Strings> localizer;

        /// <summary>
        /// Initializes a new instance of the <see cref="NotificationHelper"/> class.
        /// </summary>
        /// <param name="logger">Sends logs to the logger service.</param>
        /// <param name="botFrameworkHttpAdapter">Instance of bot framework HTTP adapter</param>
        /// <param name="aadOptions">A set of key/value application configuration properties with AAD settings.</param>
        /// <param name="botOptions">A set of key/value application configuration properties with bot settings.</param>
        /// <param name="userDetailProvider">Provider instance to work with user data.</param>
        /// <param name="localizer">The current cultures' string localizer.</param>
        public NotificationHelper(
            ILogger<NotificationHelper> logger,
            IBotFrameworkHttpAdapter botFrameworkHttpAdapter,
            IOptions<AzureActiveDirectorySettings> aadOptions,
            IOptions<BotSettings> botOptions,
            IUserDetailProvider userDetailProvider,
            IStringLocalizer<Strings> localizer)
        {
            this.logger = logger;
            this.botFrameworkHttpAdapter = botFrameworkHttpAdapter;
            this.aadOptions = aadOptions;
            this.botOptions = botOptions;
            this.userDetailProvider = userDetailProvider;
            this.localizer = localizer;
        }

        /// <summary>
        /// Sends notification to project owner when user joins project.
        /// </summary>
        /// <param name="projectEntity">ProjectEntity Model containing project metadata.</param>
        /// <param name="userName">Name of user joining the project.</param>
        /// <param name="userPrincipalName">UserPrincipalName of user joining the project.</param>
        /// <returns>A Task representing notification sent to project owner.</returns>
        public async Task SendProjectJoinedNotificationAsync(
            ProjectEntity projectEntity,
            string userName,
            string userPrincipalName)
        {
            projectEntity = projectEntity ?? throw new ArgumentNullException(nameof(projectEntity));

            var adaptiveCard = MessageFactory.Attachment(UserNotificationCard.SendProjectJoinedCard(
                projectEntity.ProjectId,
                projectEntity.Title,
                userName,
                userPrincipalName,
                projectEntity.CreatedByUserId,
                this.localizer));

            var userDetails = await this.userDetailProvider.GetUserDetailsAsync(projectEntity.CreatedByUserId);

            if (userDetails != null)
            {
                await this.SendNotificationAsync(
                    userDetails.UserConversationId,
                    adaptiveCard,
                    userDetails.ServiceUrl);
            }
        }

        /// <summary>
        /// Sends notification to team members when project is closed.
        /// </summary>
        /// <param name="closeProjectModel">CloseProjectModel model containing project closure metadata.</param>
        /// <param name="projectTitle">Title of the project.</param>
        /// <param name="projectOwnerName">Owner of the project.</param>
        /// <returns>A Task representing notification sent to all members in project.</returns>
        public async Task SendProjectClosureNotificationAsync(
            CloseProjectModel closeProjectModel,
            string projectTitle,
            string projectOwnerName)
        {
            closeProjectModel = closeProjectModel ?? throw new ArgumentNullException(nameof(closeProjectModel));

            foreach (var participant in closeProjectModel.ProjectParticipantDetails)
            {
                List<string> acquiredSkills = participant.AcquiredSkills.Split(new char[] { ';' }, System.StringSplitOptions.RemoveEmptyEntries).ToList();
                var adaptiveCard = MessageFactory.Attachment(UserNotificationCard.SendProjectClosureCard(
                    projectTitle,
                    projectOwnerName,
                    this.botOptions.Value.ManifestId,
                    participant.Feedback,
                    acquiredSkills,
                    this.localizer));

                var userDetails = await this.userDetailProvider.GetUserDetailsAsync(participant.UserId);

                if (userDetails != null)
                {
                    await this.SendNotificationAsync(
                        userDetails.UserConversationId,
                        adaptiveCard,
                        userDetails.ServiceUrl);
                }
            }
        }

        /// <summary>
        /// Sends notification to team members when project is deleted.
        /// </summary>
        /// <param name="projectEntity">ProjectEntity model containing project metadata.</param>
        /// <returns>A Task representing notification sent to all members in project.</returns>
        public async Task SendProjectDeletionNotificationAsync(
            ProjectEntity projectEntity)
        {
            projectEntity = projectEntity ?? throw new ArgumentNullException(nameof(projectEntity));
            var userIds = projectEntity.ProjectParticipantsUserIds.Split(new char[] { ';' }, System.StringSplitOptions.RemoveEmptyEntries);

            foreach (var userId in userIds)
            {
                var adaptiveCard = MessageFactory.Attachment(UserNotificationCard.SendProjectDeletionCard(
                    projectEntity.Title,
                    projectEntity.CreatedByName,
                    this.botOptions.Value.ManifestId,
                    this.localizer));

                var userDetails = await this.userDetailProvider.GetUserDetailsAsync(userId);

                if (userDetails != null)
                {
                    await this.SendNotificationAsync(
                        userDetails.UserConversationId,
                        adaptiveCard,
                        userDetails.ServiceUrl);
                }
            }
        }

        /// <summary>
        /// Sends notification to user on removal from project.
        /// </summary>
        /// <param name="userIds">List of users to be notified.</param>
        /// <param name="projectTitle">Project title.</param>
        /// <param name="projectOwner">Project owner.</param>
        /// <returns>A Task representing notification to user on removal.</returns>
        public async Task SendProjectRemovalNotificationAsync(
            List<string> userIds,
            string projectTitle,
            string projectOwner)
        {
            userIds = userIds ?? throw new ArgumentNullException(nameof(userIds));

            foreach (var userId in userIds)
            {
                var adaptiveCard = MessageFactory.Attachment(UserNotificationCard.SendProjectRemovalCard(
                    projectTitle.Trim(),
                    projectOwner,
                    this.botOptions.Value.ManifestId,
                    this.localizer));

                var userDetails = await this.userDetailProvider.GetUserDetailsAsync(userId);

                if (userDetails != null)
                {
                    await this.SendNotificationAsync(
                        userDetails.UserConversationId,
                        adaptiveCard,
                        userDetails.ServiceUrl);
                }
            }
        }

        /// <summary>
        /// Send notification to user in personal scope.
        /// </summary>
        /// <param name="conversationId">User conversation id.</param>
        /// <param name="adaptiveCard">Notification card to send.</param>
        /// <param name="servicePath">Service url of a tenant.</param>
        /// <returns>A Task representing notification to user.</returns>
        private async Task SendNotificationAsync(
            string conversationId,
            IMessageActivity adaptiveCard,
            string servicePath)
        {
            MicrosoftAppCredentials.TrustServiceUrl(servicePath);
            var conversationReference = new ConversationReference()
            {
                ChannelId = Constants.TeamsBotFrameworkChannelId,
                Bot = new ChannelAccount() { Id = $"28:{this.aadOptions.Value.ClientId}" },
                ServiceUrl = servicePath,
                Conversation = new ConversationAccount() { Id = conversationId },
            };

            this.logger.LogInformation($"sending notification to conversationId- {conversationId}");

            try
            {
                await this.retryPolicy.ExecuteAsync(async () =>
                {
                    await ((BotFrameworkAdapter)this.botFrameworkHttpAdapter).ContinueConversationAsync(
                    this.aadOptions.Value.ClientId,
                    conversationReference,
                    async (turnContext, cancellationToken) =>
                    {
                        await turnContext.SendActivityAsync(adaptiveCard, cancellationToken);
                    },
                    CancellationToken.None);
                });
            }
#pragma warning disable CA1031 // Caching general exception to continue execution for sending notification cards to user.
            catch (Exception ex)
#pragma warning restore CA1031 // Caching general exception to continue execution for sending notification cards to user.
            {
                this.logger.LogError(ex, $"Error while sending notification card.");
            }
        }
    }
}
