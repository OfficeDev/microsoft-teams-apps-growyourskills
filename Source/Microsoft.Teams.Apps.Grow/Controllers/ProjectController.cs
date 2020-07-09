// <copyright file="ProjectController.cs" company="Microsoft">
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
    using Microsoft.Teams.Apps.Grow.Common;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Helpers;
    using Microsoft.Teams.Apps.Grow.Models;

    /// <summary>
    /// Controller to handle project API operations.
    /// </summary>
    [ApiController]
    [Route("api/project")]
    [Authorize]
    public class ProjectController : BaseGrowController
    {
        /// <summary>
        /// Maximum number of owner names to get.
        /// </summary>
        private const int MaximumOwnersCount = 50;

        /// <summary>
        /// Logs errors and information.
        /// </summary>
        private readonly ILogger logger;

        /// <summary>
        /// Helper for creating models and filtering projects as per criteria.
        /// </summary>
        private readonly IProjectHelper projectHelper;

        /// <summary>
        /// Provides methods for add, update and delete project operations from database.
        /// </summary>
        private readonly IProjectStorageProvider projectStorageProvider;

        /// <summary>
        /// Project search service for fetching project with search criteria and filters.
        /// </summary>
        private readonly IProjectSearchService projectSearchService;

        /// <summary>
        /// Provides methods to send notifications to users.
        /// </summary>
        private readonly NotificationHelper notificationHelper;

        /// <summary>
        /// Initializes a new instance of the <see cref="ProjectController"/> class.
        /// </summary>
        /// <param name="logger">Logs errors and information.</param>
        /// <param name="telemetryClient">The Application Insights telemetry client.</param>
        /// <param name="projectHelper">Helper for creating models and filtering projects as per criteria.</param>
        /// <param name="projectStorageProvider">Provides methods for add, update and delete project operations from database.</param>
        /// <param name="projectSearchService">Project search service for fetching project with search criteria and filters.</param>
        /// <param name="notificationHelper">Provides methods to send notifications to users.</param>
        public ProjectController(
            ILogger<ProjectController> logger,
            TelemetryClient telemetryClient,
            IProjectHelper projectHelper,
            IProjectStorageProvider projectStorageProvider,
            IProjectSearchService projectSearchService,
            NotificationHelper notificationHelper)
            : base(telemetryClient)
        {
            this.logger = logger;
            this.projectHelper = projectHelper;
            this.projectStorageProvider = projectStorageProvider;
            this.projectSearchService = projectSearchService;
            this.notificationHelper = notificationHelper;
        }

        /// <summary>
        /// Fetch projects according to page count.
        /// </summary>
        /// <param name="pageCount">Page number to get search data.</param>
        /// <returns>List of projects.</returns>
        [HttpGet]
        public async Task<IActionResult> GetAsync(int pageCount)
        {
            this.RecordEvent("Get project - HTTP Get call initiated");

            if (pageCount < 0)
            {
                this.logger.LogError($"{nameof(pageCount)} is found to be less than zero during {nameof(this.GetAsync)} call.");
                return this.BadRequest($"Parameter {nameof(pageCount)} cannot be less than zero.");
            }

            var skipRecords = pageCount * Constants.LazyLoadPerPageProjectCount;

            try
            {
                var projects = await this.projectSearchService.GetProjectsAsync(
                    ProjectSearchScope.AllProjects,
                    searchQuery: null,
                    userObjectId: null,
                    count: Constants.LazyLoadPerPageProjectCount,
                    skip: skipRecords);

                this.RecordEvent("Get project - HTTP Get call succeeded");

                return this.Ok(projects);
            }
            catch (Exception ex)
            {
                this.RecordEvent($"Error while fetching projects for user {this.UserAadId}.");
                this.logger.LogError(ex, $"Error while fetching projects for user {this.UserAadId}.");
                throw;
            }
        }

        /// <summary>
        /// Stores new project details.
        /// </summary>
        /// <param name="projectDetail">Project detail which needs to be stored.</param>
        /// <returns>Returns project for successful operation or false for failure.</returns>
        [HttpPost]
        public async Task<IActionResult> PostAsync([FromBody] ProjectEntity projectDetail)
        {
            this.RecordEvent("Call to add project details.");
            this.logger.LogInformation("Call to add project details.");

#pragma warning disable CA1062 // Project start date and end date are validated by model validations and responded with bad request status.
            if (projectDetail.ProjectStartDate > projectDetail.ProjectEndDate)
#pragma warning restore CA1062 // Project start date and end date are validated by model validations and responded with bad request status.
            {
                this.RecordEvent("Project start date must be less than end date.");
                this.logger.LogInformation("Project start date must be less than end date.");
                return this.BadRequest("Project start date must be less than end date.");
            }

            try
            {
                var projectEntity = new ProjectEntity
                {
                    ProjectId = Guid.NewGuid().ToString(),
                    Status = (int)ProjectStatus.NotStarted, // Project status as 'Not Started'.
                    CreatedByUserId = this.UserAadId,
                    CreatedByName = this.UserName,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow,
                    Title = projectDetail.Title,
                    Description = projectDetail.Description,
                    SupportDocuments = projectDetail.SupportDocuments,
                    RequiredSkills = projectDetail.RequiredSkills,
                    ProjectStartDate = projectDetail.ProjectStartDate,
                    ProjectEndDate = projectDetail.ProjectEndDate,
                    ProjectClosedDate = projectDetail.ProjectEndDate,
                    ProjectParticipantsUserIds = string.Empty,
                    ProjectParticipantsUserMapping = string.Empty,
                    TeamSize = projectDetail.TeamSize,
                    IsRemoved = false,
                };

                var result = await this.projectStorageProvider.UpsertProjectAsync(projectEntity);

                // If operation is successful, run Azure search service indexer.
                if (result)
                {
                    this.RecordEvent("Save project - HTTP Post call succeeded.");
                    await this.projectSearchService.RunIndexerOnDemandAsync();
                    return this.Ok(projectEntity);
                }
                else
                {
                    this.logger.LogError("Save project - HTTP Post call failed.");
                    this.RecordEvent("Save project - HTTP Post call failed.");
                    return this.Ok(false);
                }
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while adding new project.");
                this.logger.LogError(ex, "Error while adding new project.");
                throw;
            }
        }

        /// <summary>
        /// Updates existing project details.
        /// </summary>
        /// <param name="projectDetails">Project details which needs to be updated.</param>
        /// <returns>Returns true for successful operation.</returns>
        [HttpPatch]
        public async Task<IActionResult> PatchAsync([FromBody] ProjectEntity projectDetails)
        {
            this.RecordEvent("Update project - HTTP Patch call initiated");

#pragma warning disable CA1062 // project details are validated by model validations for null check and is responded with bad request status
            if (string.IsNullOrEmpty(projectDetails.ProjectId))
#pragma warning restore CA1062 // project details are validated by model validations for null check and is responded with bad request status
            {
                this.logger.LogError($"Project Id is either null or empty.");
                this.RecordEvent("Update project - HTTP Patch call failed");

                return this.BadRequest("Project Id cannot be null or empty.");
            }

#pragma warning disable CA1062 // Project start date and end date are validated by model validations and responded with bad request status.
            if (projectDetails.ProjectStartDate > projectDetails.ProjectEndDate)
#pragma warning restore CA1062 // Project start date and end date are validated by model validations and responded with bad request status.
            {
                this.RecordEvent("Project start date must be less than end date.");
                this.logger.LogInformation("Project start date must be less than end date.");
                return this.BadRequest("Project start date must be less than end date.");
            }

            try
            {
                // Validating Project Id as it will be generated at server side in case of adding new project but cannot be null or empty in case of update.
                var currentProject = await this.projectStorageProvider.GetProjectAsync(this.UserAadId, projectDetails.ProjectId);

                if (currentProject == null || currentProject.IsRemoved)
                {
                    this.logger.LogError($"Could not find project {projectDetails.ProjectId} for user {this.UserAadId}.");
                    this.RecordEvent("Update project - HTTP Patch call failed");
                    return this.NotFound($"Project {projectDetails.ProjectId} does not exists.");
                }

                var updatedProjectParticipants = projectDetails.ProjectParticipantsUserIds.Split(';');
                var currentProjectParticipants = currentProject.ProjectParticipantsUserIds.Split(';');
                var removedProjectParticipants = currentProjectParticipants.Except(updatedProjectParticipants).ToList();

                currentProject.Status = projectDetails.Status;
                currentProject.Title = projectDetails.Title;
                currentProject.Description = projectDetails.Description;
                currentProject.SupportDocuments = projectDetails.SupportDocuments;
                currentProject.RequiredSkills = projectDetails.RequiredSkills;
                currentProject.ProjectStartDate = projectDetails.ProjectStartDate;
                currentProject.ProjectEndDate = projectDetails.ProjectEndDate;
                currentProject.TeamSize = projectDetails.TeamSize;
                currentProject.ProjectParticipantsUserIds = projectDetails.ProjectParticipantsUserIds;
                currentProject.ProjectParticipantsUserMapping = projectDetails.ProjectParticipantsUserMapping;
                currentProject.UpdatedDate = DateTime.UtcNow;

                var upsertResult = await this.projectStorageProvider.UpsertProjectAsync(currentProject);

                // If operation is successful, run indexer and sent notification to removed participants.
                if (upsertResult)
                {
                    this.RecordEvent("Project - HTTP Patch call succeeded.");
                    await this.projectSearchService.RunIndexerOnDemandAsync();

                    // Send notification for removed users.
                    if (removedProjectParticipants != null && removedProjectParticipants.Any())
                    {
                        await this.notificationHelper.SendProjectRemovalNotificationAsync(
                            removedProjectParticipants,
                            currentProject.Title,
                            currentProject.CreatedByName);
                    }
                }
                else
                {
                    this.RecordEvent("Update project - HTTP Patch call failed");
                    this.logger.LogError("Update project action failed");
                }

                return this.Ok(upsertResult);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while updating project details.");
                this.logger.LogError(ex, "Error while updating project details.");
                throw;
            }
        }

        /// <summary>
        /// Delete a project.
        /// </summary>
        /// <param name="projectId">Project Id of the project to be deleted.</param>
        /// <returns>Returns true for successful operation.</returns>
        [HttpDelete]
        public async Task<IActionResult> DeleteAsync(string projectId)
        {
            this.RecordEvent("Delete project - HTTP Delete call initiated");

            if (string.IsNullOrEmpty(projectId))
            {
                this.logger.LogError("Project Id is found null or empty.");
                return this.BadRequest("Project Id cannot be null or empty.");
            }

            try
            {
                var projectDetails = await this.projectStorageProvider.GetProjectAsync(this.UserAadId, projectId);

                if (projectDetails == null || projectDetails.IsRemoved)
                {
                    this.logger.LogError($"Project {projectId} created by user {this.UserAadId} not found for deletion.");
                    return this.NotFound($"Cannot find project {projectId} created by user {this.UserAadId} for deletion.");
                }

                // Only projects with status except 'Closed' status are allowed to delete.
                if (projectDetails.Status == (int)ProjectStatus.Closed)
                {
                    this.logger.LogError($"Project {projectId} cannot be deleted for status {(ProjectStatus)projectDetails.Status}");
                    return this.Forbid($"Project with status '{projectDetails.Status}' cannot be deleted.");
                }

                projectDetails.IsRemoved = true;
                var deletionResult = await this.projectStorageProvider.UpsertProjectAsync(projectDetails);

                // Run indexer if operation is successful.
                if (deletionResult)
                {
                    await this.projectSearchService.RunIndexerOnDemandAsync();

                    // Send Notification to users on project deletion.
                    await this.notificationHelper.SendProjectDeletionNotificationAsync(
                        projectDetails);

                    this.RecordEvent("Delete project - HTTP Delete call succeeded");
                }
                else
                {
                    this.RecordEvent("Delete project - HTTP Delete call failed");
                }

                return this.Ok(deletionResult);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while deleting project.");
                this.logger.LogError(ex, "Error while deleting project.");
                throw;
            }
        }

        /// <summary>
        /// Get project details.
        /// </summary>
        /// <param name="projectId">Project Id to fetch project details.</param>
        /// <param name="createdByUserId">User Id who created project.</param>
        /// <returns>Returns true for successful operation.</returns>
        [HttpGet("project-detail")]
        public async Task<IActionResult> GetProjectDetailAsync(string projectId, string createdByUserId)
        {
            this.logger.LogInformation("Call to get project details.");

            if (string.IsNullOrEmpty(projectId))
            {
                this.logger.LogError("ProjectId is either null or empty.");
                return this.BadRequest("ProjectId is either null or empty.");
            }

            try
            {
                var projectEntity = await this.projectStorageProvider.GetProjectAsync(createdByUserId, projectId);
                return this.Ok(projectEntity);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while getting project details.");
                this.logger.LogError(ex, "Error while getting project details.");
                throw;
            }
        }

        /// <summary>
        /// Get unique project owner names.
        /// </summary>
        /// <returns>Returns unique project owner names.</returns>
        [HttpGet("project-owners")]
        public async Task<IActionResult> GetUniqueProjectOwnerNamesAsync()
        {
            try
            {
                this.logger.LogInformation("Call to get unique project owner names.");

                // Search query will be null if there is no search criteria used.
                // userObjectId will be used when we want to get projects created by respective user.
                var projects = await this.projectSearchService.GetProjectsAsync(
                    ProjectSearchScope.UniqueProjectOwnerNames,
                    searchQuery: null,
                    userObjectId: null);

                if (projects == null)
                {
                    this.logger.LogInformation("No projects are available for search");

                    // return null with 200 status if no projects are added in storage yet.
                    this.Ok(new List<string>());
                }

                var ownerNames = projects.GroupBy(project => project.CreatedByUserId)
                    .OrderByDescending(groupedProject => groupedProject.Count())
                    .Take(MaximumOwnersCount)
                    .Select(project => project.First().CreatedByName)
                    .OrderBy(createdByName => createdByName);

                this.RecordEvent("Project unique user names - HTTP Get call succeeded.");

                return this.Ok(ownerNames);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while making call to get unique project owner names.");
                this.logger.LogError(ex, "Error while making call to get unique project owner names.");
                throw;
            }
        }

        /// <summary>
        /// Get list of projects as per the Title/Description/Skills search text.
        /// </summary>
        /// <param name="searchText">Search text represents the Title/Description/Skills field value to find and get projects.</param>
        /// <param name="pageCount">Page number to get search data from Azure Search service.</param>
        /// <returns>List of filtered projects as per the search text.</returns>
        [HttpGet("search-projects")]
        public async Task<IActionResult> SearchProjectsAsync(string searchText, int pageCount)
        {
            this.logger.LogInformation("Call to get list of projects according to searched text.");

            if (pageCount < 0)
            {
                this.logger.LogError($"{nameof(pageCount)} is found to be less than zero during {nameof(this.SearchProjectsAsync)} call.");
                return this.BadRequest($"Parameter {nameof(pageCount)} cannot be less than zero.");
            }

            var skipRescords = pageCount * Constants.LazyLoadPerPageProjectCount;

            try
            {
                var searchedProjects = await this.projectSearchService.GetProjectsAsync(
                    ProjectSearchScope.SearchProjects,
                    searchText,
                    userObjectId: null,
                    skip: skipRescords,
                    count: Constants.LazyLoadPerPageProjectCount);

                this.RecordEvent("Project search - HTTP Get call succeeded.");

                return this.Ok(searchedProjects);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while making call to get projects as per the Title/Description/Skills search text.");
                this.logger.LogError(ex, "Error while making call to get projects as per the Title/Description/Skills search text.");
                throw;
            }
        }

        /// <summary>
        /// Get projects as per the applied filters.
        /// </summary>
        /// <param name="status">Semicolon separated status of projects like Not started/Active/Blocked/Closed.</param>
        /// <param name="projectOwnerNames">Semicolon separated project owner names to filter the projects.</param>
        /// <param name="skills">Semicolon separated skills to match the projects skills for which data will fetch.</param>
        /// <param name="pageCount">Page count for which projects needs to be fetched.</param>
        /// <returns>Returns filtered list of projects as per the selected filters.</returns>
        [HttpGet("applied-filters-projects")]
        public async Task<IActionResult> GetFilteredProjectsAsync(string status, string projectOwnerNames, string skills, int pageCount)
        {
            this.RecordEvent("Get filtered projects - HTTP Get call succeeded");

            if (pageCount < 0)
            {
                this.logger.LogError($"{nameof(pageCount)} is found to be less than zero during {nameof(this.GetFilteredProjectsAsync)} call.");
                return this.BadRequest($"Parameter {nameof(pageCount)} cannot be less than zero.");
            }

            var skipRecords = pageCount * Constants.LazyLoadPerPageProjectCount;

            try
            {
                // If no skills selected for filtering then get projects irrespective of skills.
                var skillsQuery = string.IsNullOrEmpty(skills) ? "*" : this.projectHelper.CreateSkillsQuery(skills);
                var filterQuery = this.projectHelper.CreateFilterSearchQuery(status, projectOwnerNames);

                var projects = await this.projectSearchService.GetProjectsAsync(
                    ProjectSearchScope.FilterTeamProjects,
                    skillsQuery,
                    userObjectId: null,
                    filterQuery: filterQuery,
                    count: Constants.LazyLoadPerPageProjectCount,
                    skip: skipRecords);

                this.RecordEvent("Get filtered projects - HTTP Get call succeeded");

                return this.Ok(projects);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while fetching filtered projects.");
                this.logger.LogError(ex, "Error while fetching filtered projects.");
                throw;
            }
        }

        /// <summary>
        /// Get list of unique skills to show on filter bar drop-down list.
        /// </summary>
        /// <param name="searchText">Search text represents the text to find and get unique skills.</param>
        /// <returns>Represents a list of unique skills.</returns>
        [HttpGet("unique-skills")]
        public async Task<IActionResult> UniqueSkillsAsync(string searchText)
        {
            this.logger.LogInformation("Call to get list of unique skills to show on filter bar Skills drop-down list.");

            if (string.IsNullOrEmpty(searchText))
            {
                this.logger.LogError("Search text is either null or empty.");
                return this.BadRequest("Search text is either null or empty.");
            }

            var uniqueSkills = new List<string>();

            try
            {
                var projects = await this.projectSearchService.GetProjectsAsync(ProjectSearchScope.UniqueSkills, searchText, userObjectId: null);

                if (projects != null && projects.Any())
                {
                    uniqueSkills = this.projectHelper.GetUniqueSkills(projects, searchText).ToList();
                    this.RecordEvent("Project unique skills- HTTP Get call succeeded.");

                    return this.Ok(uniqueSkills);
                }
                else
                {
                    this.logger.LogInformation($"Skills not found for search text {searchText}.");
                }

                return this.Ok(uniqueSkills);
            }
            catch (Exception ex)
            {
                this.RecordEvent("Error while making call to get unique skills.");
                this.logger.LogError(ex, "Error while making call to get unique skills.");
                throw;
            }
        }

        /// <summary>
        /// Get call to retrieve list of user joined projects.
        /// </summary>
        /// <param name="pageCount">Page number to get search data from Azure Search service.</param>
        /// <returns>List of user joined projects.</returns>
        [HttpGet("user-joined-projects")]
        public async Task<IActionResult> UserJoinedProjects(int pageCount)
        {
            this.logger.LogInformation("Call to retrieve list of user joined projects.");

            if (pageCount < 0)
            {
                this.logger.LogError($"{nameof(pageCount)} is found to be less than zero during {nameof(this.UserJoinedProjects)} call.");
                return this.BadRequest($"Parameter {nameof(pageCount)} cannot be less than zero.");
            }

            var skipRecords = pageCount * Constants.LazyLoadPerPageProjectCount;

            try
            {
                var joinedProjects = await this.projectSearchService.GetProjectsAsync(
                    ProjectSearchScope.JoinedProjects,
                    searchQuery: this.UserAadId,
                    userObjectId: this.UserAadId,
                    count: Constants.LazyLoadPerPageProjectCount,
                    skip: skipRecords);

                if (joinedProjects != null && joinedProjects.Any())
                {
                    var filteredProjects = this.projectHelper.GetFilteredProjectsJoinedByUser(joinedProjects, this.UserAadId);
                    this.RecordEvent("User joined projects- HTTP Get call succeeded.");

                    return this.Ok(filteredProjects);
                }
                else
                {
                    this.logger.LogInformation($"No joined projects found for user {this.UserAadId}.");
                }

                return this.Ok(new List<ProjectEntity>());
            }
            catch (Exception ex)
            {
                this.RecordEvent($"Error while fetching user joined projects for user {this.UserAadId}.");
                this.logger.LogError(ex, $"Error while fetching user joined projects for user {this.UserAadId}.");
                throw;
            }
        }

        /// <summary>
        /// Get call to retrieve list of user created projects.
        /// </summary>
        /// <param name="pageCount">Page number to get search data from Azure Search service.</param>
        /// <returns>List of user created projects.</returns>
        [HttpGet("user-created-projects")]
        public async Task<IActionResult> UserCreatedProjects(int pageCount)
        {
            this.logger.LogInformation("Call to retrieve list of user created projects.");

            if (pageCount < 0)
            {
                this.logger.LogError($"{nameof(pageCount)} is found to be less than zero during {nameof(this.UserCreatedProjects)} call.");
                return this.BadRequest($"Parameter {nameof(pageCount)} cannot be less than zero.");
            }

            var skipRecords = pageCount * Constants.LazyLoadPerPageProjectCount;

            try
            {
                var createdProjects = await this.projectSearchService.GetProjectsAsync(
                    ProjectSearchScope.CreatedProjectsByUser,
                    searchQuery: null,
                    userObjectId: this.UserAadId,
                    count: Constants.LazyLoadPerPageProjectCount,
                    skip: skipRecords);

                if (createdProjects != null && createdProjects.Any())
                {
                    this.RecordEvent("User created projects- HTTP Get call succeeded.");
                    return this.Ok(createdProjects);
                }
                else
                {
                    this.logger.LogInformation($"No created projects found for user {this.UserAadId}.");
                }

                return this.Ok(new List<ProjectEntity>());
            }
            catch (Exception ex)
            {
                this.RecordEvent($"Error while fetching created projects for user {this.UserAadId}.");
                this.logger.LogError(ex, $"Error while fetching created projects for user {this.UserAadId}.");
                throw;
            }
        }
    }
}