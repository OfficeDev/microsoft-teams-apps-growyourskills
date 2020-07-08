// <copyright file="GrowActivityMiddleware.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Bot
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.Bot.Builder;
    using Microsoft.Bot.Schema;
    using Microsoft.Extensions.Logging;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Represents middleware that can operate on incoming activities.
    /// </summary>
    public class GrowActivityMiddleware : IMiddleware
    {
        /// <summary>
        /// Represents unique id of a Tenant.
        /// </summary>
        private readonly string tenantId;

        /// <summary>
        /// Represents a set of key/value application configuration properties for Grow Bot.
        /// </summary>
        private readonly IOptions<BotSettings> options;

        /// <summary>
        /// Sends logs to the logger service.
        /// </summary>
        private readonly ILogger<GrowActivityMiddleware> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="GrowActivityMiddleware"/> class.
        /// </summary>
        /// <param name="options"> A set of key/value application configuration properties.</param>
        /// <param name="logger">Sends logs to the logger service.</param>
        public GrowActivityMiddleware(IOptions<BotSettings> options, ILogger<GrowActivityMiddleware> logger)
        {
            this.options = options ?? throw new ArgumentNullException(nameof(options));
            this.logger = logger;
            this.tenantId = this.options.Value.TenantId;
        }

        /// <summary>
        ///  Processes an incoming activity in middleware.
        /// </summary>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="next">The delegate to call to continue the bot middleware pipeline.</param>
        /// <param name="cancellationToken"> A cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
        /// <returns><see cref="Task"/> A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// Middleware calls the next delegate to pass control to the next middleware in
        /// the pipeline. If middleware doesn’t call the next delegate, the adapter does
        /// not call any of the subsequent middleware’s request handlers or the bot’s receive
        /// handler, and the pipeline short circuits.
        /// The turnContext provides information about the incoming activity, and other data
        /// needed to process the activity.
        /// </remarks>
        public async Task OnTurnAsync(ITurnContext turnContext, NextDelegate next, CancellationToken cancellationToken = default)
        {
            next = next ?? throw new ArgumentNullException(nameof(next));

            if (turnContext != null && turnContext.Activity.Type != ActivityTypes.Event && !this.IsActivityFromExpectedTenant(turnContext))
            {
                this.logger.LogWarning($"Unexpected tenant id {turnContext?.Activity.Conversation.TenantId}");
            }
            else
            {
                await next(cancellationToken);
            }
        }

        /// <summary>
        /// Verify if the tenant id in the message is the same tenant id used when application was configured.
        /// </summary>
        /// <param name="turnContext">Context object containing information cached for a single turn of conversation with a user.</param>
        /// <returns>True if context is from expected tenant else false.</returns>
        private bool IsActivityFromExpectedTenant(ITurnContext turnContext)
        {
            turnContext = turnContext ?? throw new ArgumentNullException(nameof(turnContext));

            return turnContext.Activity?.Conversation?.TenantId == this.tenantId;
        }
    }
}
