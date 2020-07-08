// <copyright file="MustBeTeamMemberUserPolicyHandler.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Authentication.AuthenticationPolicy
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc.Filters;
    using Microsoft.Extensions.Caching.Memory;
    using Microsoft.Extensions.Options;
    using Microsoft.Teams.Apps.Grow.Common;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Linq;

    /// <summary>
    /// This authorization handler is created to handle project creator's user policy.
    /// The class implements AuthorizationHandler for handling MustBeTeamMemberUserPolicyRequirement authorization.
    /// </summary>
    public class MustBeTeamMemberUserPolicyHandler : AuthorizationHandler<MustBeTeamMemberUserPolicyRequirement>
    {
        /// <summary>
        /// Cache for storing authorization result.
        /// </summary>
        private readonly IMemoryCache memoryCache;

        /// <summary>
        /// A set of key/value application configuration properties for Activity settings.
        /// </summary>
        private readonly IOptions<BotSettings> botOptions;

        /// <summary>
        /// Provider to fetch team details from bot adapter.
        /// </summary>
        private readonly ITeamsInfoHelper teamsInfoHelper;

        /// <summary>
        /// Initializes a new instance of the <see cref="MustBeTeamMemberUserPolicyHandler"/> class.
        /// </summary>
        /// <param name="memoryCache">MemoryCache instance for caching authorization result.</param>
        /// <param name="botOptions">A set of key/value application configuration properties for activity handler.</param>
        /// <param name="teamsInfoHelper">Provider to fetch team details from bot adapter.</param>
        public MustBeTeamMemberUserPolicyHandler(
            IMemoryCache memoryCache,
            IOptions<BotSettings> botOptions,
            ITeamsInfoHelper teamsInfoHelper)
        {
            this.memoryCache = memoryCache;
            this.botOptions = botOptions ?? throw new ArgumentNullException(nameof(botOptions));
            this.teamsInfoHelper = teamsInfoHelper;
        }

        /// <summary>
        /// This method handles the authorization requirement.
        /// </summary>
        /// <param name="context">AuthorizationHandlerContext instance.</param>
        /// <param name="requirement">IAuthorizationRequirement instance.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, MustBeTeamMemberUserPolicyRequirement requirement)
        {
            context = context ?? throw new ArgumentNullException(nameof(context));

            string teamId = string.Empty;
            var oidClaimType = "http://schemas.microsoft.com/identity/claims/objectidentifier";

            var oidClaim = context.User.Claims.FirstOrDefault(p => oidClaimType == p.Type);

            if (context.Resource is AuthorizationFilterContext authorizationFilterContext)
            {
                // Wrap the request stream so that we can rewind it back to the start for regular request processing.
                authorizationFilterContext.HttpContext.Request.EnableBuffering();

                if (string.IsNullOrEmpty(authorizationFilterContext.HttpContext.Request.QueryString.Value))
                {
                    // Read the request body, parse out the activity object, and set the parsed culture information.
                    var streamReader = new StreamReader(authorizationFilterContext.HttpContext.Request.Body, Encoding.UTF8, true, 1024, leaveOpen: true);
                    using (var jsonReader = new JsonTextReader(streamReader))
                    {
                        var obj = JObject.Load(jsonReader);
                        var teamEntity = obj.ToObject<TeamEntity>();
                        authorizationFilterContext.HttpContext.Request.Body.Seek(0, SeekOrigin.Begin);
                        teamId = teamEntity.TeamId;
                    }
                }
                else
                {
                    var requestQuery = authorizationFilterContext.HttpContext.Request.Query;
                    teamId = requestQuery.Where(queryData => queryData.Key == "teamId").Select(queryData => queryData.Value.ToString()).FirstOrDefault();
                }
            }

            if (await this.ValidateUserIsPartOfTeamAsync(teamId, oidClaim.Value))
            {
                context.Succeed(requirement);
            }
        }

        /// <summary>
        /// Check if a user is a member of a certain team.
        /// </summary>
        /// <param name="teamId">The team id that the validator uses to check if the user is a member of the team. </param>
        /// <param name="userAadObjectId">The user's Azure Active Directory object id.</param>
        /// <returns>The flag indicates that the user is a part of certain team or not.</returns>
        private async Task<bool> ValidateUserIsPartOfTeamAsync(string teamId, string userAadObjectId)
        {
            // The key is generated by combining teamId and user object id.
            bool isCacheEntryExists = this.memoryCache.TryGetValue(this.GetCacheKey(teamId, userAadObjectId), out bool isUserValidMember);
            if (!isCacheEntryExists)
            {
                var teamMember = await this.teamsInfoHelper.GetTeamMemberAsync(teamId, userAadObjectId);
                isUserValidMember = teamMember != null;
                this.memoryCache.Set(this.GetCacheKey(teamId, userAadObjectId), isUserValidMember, TimeSpan.FromMinutes(this.botOptions.Value.CacheDurationInMinutes));
            }

            return isUserValidMember;
        }

        /// <summary>
        /// Generate key by combining teamId and user object id.
        /// </summary>
        /// <param name="teamId">The team id that the validator uses to check if the user is a member of the team. </param>
        /// <param name="userAadObjectId">The user's Azure Active Directory object id.</param>
        /// <returns>Generated key.</returns>
        private string GetCacheKey(string teamId, string userAadObjectId)
        {
            return CacheKeysConstants.TeamMember + teamId + userAadObjectId;
        }
    }
}
