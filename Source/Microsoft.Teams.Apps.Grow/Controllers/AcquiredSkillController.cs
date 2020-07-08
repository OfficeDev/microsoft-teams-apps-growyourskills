// <copyright file="AcquiredSkillController.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.ApplicationInsights;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.CodeAnalysis;
    using Microsoft.Extensions.Logging;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Controller to handle acquired skills API operations.
    /// </summary>
    [Route("api/acquiredskill")]
    [ApiController]
    [Authorize]
    public class AcquiredSkillController : BaseGrowController
    {
        /// <summary>
        /// Logs errors and information.
        /// </summary>
        private readonly ILogger logger;

        /// <summary>
        /// Instance of acquired skill storage provider.
        /// </summary>
        private readonly IAcquiredSkillStorageProvider acquiredSkillStorageProvider;

        /// <summary>
        /// Initializes a new instance of the <see cref="AcquiredSkillController"/> class.
        /// </summary>
        /// <param name="logger">Logs errors and information.</param>
        /// <param name="telemetryClient">The Application Insights telemetry client.</param>
        /// <param name="acquiredSkillStorageProvider">Acquired skill storage provider dependency injection.</param>
        public AcquiredSkillController(
            ILogger<AcquiredSkillController> logger,
            TelemetryClient telemetryClient,
            IAcquiredSkillStorageProvider acquiredSkillStorageProvider)
            : base(telemetryClient)
        {
            this.logger = logger;
            this.acquiredSkillStorageProvider = acquiredSkillStorageProvider;
        }

        /// <summary>
        /// Get call to retrieve list of user acquired skills.
        /// User will be able to view the skills acquired for all the projects with status as closed.
        /// </summary>
        /// <returns>List of joined projects which are in closed state.</returns>
        [HttpGet("acquired-skills")]
        public async Task<IActionResult> GetAcquiredSkillsAsync()
        {
            try
            {
                this.RecordEvent("Acquired skills - HTTP Get call initiated");

                // Get acquired skills based on user id.
                var acquiredSkills = await this.acquiredSkillStorageProvider.GetAcquiredSkillsAsync(this.UserAadId);
                this.RecordEvent("Acquired skills - HTTP Get call succeeded");

                if (acquiredSkills == null || !acquiredSkills.Any())
                {
                    this.logger.LogInformation($"No acquired skills found for user {this.UserAadId}.");
                    return this.Ok(new List<AcquiredSkillsEntity>());
                }

                return this.Ok(acquiredSkills.OrderByDescending(skill => skill.ProjectClosedDate));
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, $"Error while fetching acquired skills for user {this.UserAadId}.");
                throw;
            }
        }
    }
}