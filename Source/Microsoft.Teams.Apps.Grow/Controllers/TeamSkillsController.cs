// <copyright file="TeamSkillsController.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Controllers
{
    using System;
    using System.Threading.Tasks;
    using Microsoft.ApplicationInsights;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Logging;
    using Microsoft.Teams.Apps.Grow.Authentication.AuthenticationPolicy;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Controller to handle team skills API operations.
    /// </summary>
    [Route("api/teamskills")]
    [ApiController]
    [Authorize]
    public class TeamSkillsController : BaseGrowController
    {
        /// <summary>
        /// Logs errors and information.
        /// </summary>
        private readonly ILogger logger;

        /// <summary>
        /// Instance of team skill storage provider for team skills.
        /// </summary>
        private readonly ITeamSkillStorageProvider teamSkillStorageProvider;

        /// <summary>
        /// Initializes a new instance of the <see cref="TeamSkillsController"/> class.
        /// </summary>
        /// <param name="logger">Logs errors and information.</param>
        /// <param name="telemetryClient">The Application Insights telemetry client.</param>
        /// <param name="teamSkillStorageProvider">Team skill storage provider dependency injection.</param>
        public TeamSkillsController(
            ILogger<TeamSkillsController> logger,
            TelemetryClient telemetryClient,
            ITeamSkillStorageProvider teamSkillStorageProvider)
            : base(telemetryClient)
        {
            this.logger = logger;
            this.teamSkillStorageProvider = teamSkillStorageProvider;
        }

        /// <summary>
        /// Get call to retrieve team skills data, if user is a part of team.
        /// </summary>
        /// <param name="teamId">Team Id - unique value for each Team where skills has configured.</param>
        /// <returns>Represents Team skill entity model.</returns>
        [HttpGet]
        [Authorize(PolicyNames.MustBeTeamMemberUserPolicy)]
        public async Task<IActionResult> GetAsync(string teamId)
        {
            this.logger.LogInformation("Call to retrieve team skills data.");

            try
            {
                if (string.IsNullOrEmpty(teamId))
                {
                    this.logger.LogError($"Error while getting the team skills. TeamId:{teamId}");
                    return this.BadRequest(new { message = $"Error while getting configured skills for team {teamId}" });
                }

                var teamSkillEntity = await this.teamSkillStorageProvider.GetTeamSkillsDataAsync(teamId);
                this.RecordEvent("Team skills - HTTP Get call succeeded");

                if (teamSkillEntity == null)
                {
                    this.logger.LogInformation($"Team skill entity null for {teamId}");
                }

                return this.Ok(teamSkillEntity);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while making call to get team skills.");
                this.logger.LogError(ex, "Error while making call to get team skills.");
                throw;
            }
        }

        /// <summary>
        /// Post call to store team skill details, if user is a part of team.
        /// </summary>
        /// <param name="teamSkillDetails">Holds team skill detail entity data.</param>
        /// <returns>Returns true for successful operation.</returns>
        [HttpPost]
        [Authorize(PolicyNames.MustBeTeamMemberUserPolicy)]
        public async Task<IActionResult> PostAsync([FromBody] TeamSkillEntity teamSkillDetails)
        {
            try
            {
                if (teamSkillDetails == null)
                {
                    this.logger.LogError($"Error while adding the team skills.");
                    return this.BadRequest($"Error while adding the team skills.");
                }

                this.logger.LogInformation("Call to add team skill details.");

                var teamSkillData = await this.teamSkillStorageProvider.GetTeamSkillsDataAsync(teamSkillDetails.TeamId);
                bool result;

                if (teamSkillData == null)
                {
                    // Insert or update the skills details for a team.
                    var teamSkill = new TeamSkillEntity
                    {
                        TeamId = teamSkillDetails.TeamId,
                        Skills = teamSkillDetails.Skills,
                        CreatedByUserId = this.UserAadId,
                        UpdatedByUserId = this.UserAadId,
                    };

                    result = await this.teamSkillStorageProvider.UpsertTeamSkillsAsync(teamSkill);
                }
                else
                {
                    teamSkillData.Skills = teamSkillDetails.Skills;
                    teamSkillData.UpdatedByUserId = this.UserAadId;

                    result = await this.teamSkillStorageProvider.UpsertTeamSkillsAsync(teamSkillData);
                }

                if (result)
                {
                    this.logger.LogInformation($"User {this.UserAadId} has updated skills for team {teamSkillDetails.TeamId}.");
                    this.RecordEvent($"Team skills - HTTP Post call succeeded.");

                    return this.Ok(result);
                }

                return this.Ok(false);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while making call to store team skills.");
                this.logger.LogError(ex, "Error while making call to store team skills.");
                throw;
            }
        }
    }
}