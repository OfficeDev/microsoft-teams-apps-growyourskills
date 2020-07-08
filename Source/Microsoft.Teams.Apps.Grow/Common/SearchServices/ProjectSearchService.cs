// <copyright file="ProjectSearchService.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Common.SearchServices
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.ApplicationInsights.DataContracts;
    using Microsoft.AspNetCore.Http;
    using Microsoft.Azure.Search;
    using Microsoft.Azure.Search.Models;
    using Microsoft.Extensions.Logging;
    using Microsoft.Extensions.Options;
    using Microsoft.Rest.Azure;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Models;
    using Microsoft.Teams.Apps.Grow.Models.Configuration;
    using Polly;
    using Polly.Contrib.WaitAndRetry;
    using Polly.Retry;

    /// <summary>
    /// Project Search service which will help in creating index, indexer and data source if it doesn't exist
    /// for indexing table which will be used for search by Messaging Extension.
    /// </summary>
    public class ProjectSearchService : IProjectSearchService, IDisposable
    {
        /// <summary>
        /// Azure Search service index name.
        /// </summary>
        private const string IndexName = "grow-project-index";

        /// <summary>
        /// Azure Search service indexer name.
        /// </summary>
        private const string IndexerName = "grow-project-indexer";

        /// <summary>
        /// Azure Search service data source name.
        /// </summary>
        private const string DataSourceName = "grow-project-storage";

        /// <summary>
        /// Table name where project data will get saved.
        /// </summary>
        private const string ProjectTableName = "ProjectEntity";

        /// <summary>
        /// Azure Search service maximum search result count for project entity.
        /// </summary>
        private const int ApiSearchResultCount = 1500;

        /// <summary>
        /// Used to initialize task.
        /// </summary>
        private readonly Lazy<Task> initializeTask;

        /// <summary>
        /// Instance of Azure Search service client.
        /// </summary>
        private readonly ISearchServiceClient searchServiceClient;

        /// <summary>
        /// Instance of Azure Search index client.
        /// </summary>
        private readonly ISearchIndexClient searchIndexClient;

        /// <summary>
        /// Instance of project helper.
        /// </summary>
        private readonly IProjectStorageProvider projectStorageProvider;

        /// <summary>
        /// Logger implementation to send logs to the logger service.
        /// </summary>
        private readonly ILogger<ProjectSearchService> logger;

        /// <summary>
        /// Represents a set of key/value application configuration properties.
        /// </summary>
        private readonly SearchServiceSetting options;

        /// <summary>
        /// Retry policy with jitter.
        /// </summary>
        /// <remarks>
        /// Reference: https://github.com/Polly-Contrib/Polly.Contrib.WaitAndRetry#new-jitter-recommendation.
        /// </remarks>
        private readonly AsyncRetryPolicy retryPolicy;

        /// <summary>
        /// Helper for creating models and filtering projects as per criteria.
        /// </summary>
        private readonly IProjectHelper projectHelper;

        /// <summary>
        /// Flag: Has Dispose already been called?
        /// </summary>
        private bool disposed = false;

        /// <summary>
        /// Initializes a new instance of the <see cref="ProjectSearchService"/> class.
        /// </summary>
        /// <param name="optionsAccessor">A set of key/value application configuration properties.</param>
        /// <param name="projectStorageProvider">Project storage provider dependency injection.</param>
        /// <param name="logger">Logger implementation to send logs to the logger service.</param>
        /// <param name="searchServiceClient">Search service client dependency injection.</param>
        /// <param name="searchIndexClient">Search index client dependency injection.</param>
        /// <param name="projectHelper">Helper for creating models and filtering projects as per criteria.</param>
        public ProjectSearchService(
            IOptions<SearchServiceSetting> optionsAccessor,
            IProjectStorageProvider projectStorageProvider,
            ILogger<ProjectSearchService> logger,
            ISearchServiceClient searchServiceClient,
            ISearchIndexClient searchIndexClient,
            IProjectHelper projectHelper)
        {
            optionsAccessor = optionsAccessor ?? throw new ArgumentNullException(nameof(optionsAccessor));

            this.options = optionsAccessor.Value;
            var searchServiceValue = this.options.SearchServiceName;
            this.initializeTask = new Lazy<Task>(() => this.InitializeAsync());
            this.projectStorageProvider = projectStorageProvider;
            this.logger = logger;
            this.searchServiceClient = searchServiceClient;
            this.searchIndexClient = searchIndexClient;
            this.retryPolicy = Policy.Handle<CloudException>(
                ex => (int)ex.Response.StatusCode == StatusCodes.Status409Conflict ||
                (int)ex.Response.StatusCode == StatusCodes.Status429TooManyRequests)
                .WaitAndRetryAsync(Backoff.LinearBackoff(TimeSpan.FromMilliseconds(2000), 2));
            this.projectHelper = projectHelper;
        }

        /// <summary>
        /// Provide search result for table to be used by user's based on Azure Search service.
        /// </summary>
        /// <param name="searchScope">Scope of the search.</param>
        /// <param name="searchQuery">Query which the user had typed in Messaging Extension search field.</param>
        /// <param name="userObjectId">Azure Active Directory object id of user.</param>
        /// <param name="count">Number of search results to return.</param>
        /// <param name="skip">Number of search results to skip.</param>
        /// <param name="filterQuery">Filter bar based query.</param>
        /// <returns>List of search results.</returns>
        public async Task<IEnumerable<ProjectEntity>> GetProjectsAsync(
            ProjectSearchScope searchScope,
            string searchQuery,
            string userObjectId,
            int? count = null,
            int? skip = null,
            string filterQuery = null)
        {
            await this.EnsureInitializedAsync();
            IEnumerable<ProjectEntity> projects = new List<ProjectEntity>();
            var searchParameters = this.InitializeSearchParameters(searchScope, userObjectId, count, skip, filterQuery);

            SearchContinuationToken continuationToken = null;
            var projectsCollection = new List<ProjectEntity>();

            if (searchScope == ProjectSearchScope.SearchProjects && !string.IsNullOrWhiteSpace(searchQuery))
            {
                searchQuery = this.projectHelper.EscapeCharactersForSearchQuery(searchQuery);
            }

            var projectResult = await this.searchIndexClient.Documents.SearchAsync<ProjectEntity>(searchQuery, searchParameters);

            if (projectResult?.Results != null)
            {
                projectsCollection.AddRange(projectResult.Results.Select(p => p.Document));
                continuationToken = projectResult.ContinuationToken;
            }

            if (continuationToken == null)
            {
                return projectsCollection;
            }

            do
            {
                var projectNextResult = await this.searchIndexClient.Documents.ContinueSearchAsync<ProjectEntity>(continuationToken);

                if (projectNextResult?.Results != null)
                {
                    projectsCollection.AddRange(projectNextResult.Results.Select(p => p.Document));
                    continuationToken = projectNextResult.ContinuationToken;
                }
            }
            while (continuationToken != null);

            return projectsCollection;
        }

        /// <summary>
        /// Creates Index, Data Source and Indexer for search service.
        /// </summary>
        /// <returns>A task that represents the work queued to execute.</returns>
        public async Task CreateSearchServiceIndexAsync()
        {
            try
            {
                await this.CreateSearchIndexAsync();
                await this.CreateDataSourceAsync();
                await this.CreateIndexerAsync();
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// Run the indexer on demand.
        /// </summary>
        /// <returns>A task that represents the work queued to execute</returns>
        public async Task RunIndexerOnDemandAsync()
        {
            // Retry once after 1 second if conflict occurs during indexer run.
            // If conflict occurs again means another index run is in progress and it will index data for which first failure occurred.
            // Hence ignore second conflict and continue.
            var requestId = Guid.NewGuid().ToString();
            await this.retryPolicy.ExecuteAsync(async () =>
            {
                try
                {
                    this.logger.LogInformation($"On-demand indexer run request #{requestId} - start");
                    await this.searchServiceClient.Indexers.RunAsync(IndexerName);
                    this.logger.LogInformation($"On-demand indexer run request #{requestId} - complete");
                }
                catch (CloudException ex)
                {
                    this.logger.LogError(ex, $"Failed to run on-demand indexer run for request #{requestId}: {ex.Message}");
                    throw;
                }
            });
        }

        /// <summary>
        /// Dispose search service instance.
        /// </summary>
        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Protected implementation of Dispose pattern.
        /// </summary>
        /// <param name="disposing">True if already disposed else false.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (this.disposed)
            {
                return;
            }

            if (disposing)
            {
                this.searchServiceClient.Dispose();
                this.searchIndexClient.Dispose();
            }

            this.disposed = true;
        }

        /// <summary>
        /// Create index, indexer and data source if doesn't exist.
        /// </summary>
        /// <returns>A task that represents the work queued to execute.</returns>
        private async Task InitializeAsync()
        {
            try
            {
                // When there is no project created by user and Messaging Extension is open, table initialization is required here before creating search index or data source or indexer.
                await this.projectStorageProvider.GetProjectAsync(string.Empty, string.Empty);
                await this.CreateSearchServiceIndexAsync();
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, $"Failed to initialize Azure Search Service: {ex.Message}", SeverityLevel.Error);
                throw;
            }
        }

        /// <summary>
        /// Create index in Azure Search service if it doesn't exist.
        /// </summary>
        /// <returns><see cref="Task"/> That represents index is created if it is not created.</returns>
        private async Task CreateSearchIndexAsync()
        {
            // Recreate only if there is a change in the storage schema.
            // Manually need to drop and create index whenever there is storage schema design change.
            if (await this.searchServiceClient.Indexes.ExistsAsync(IndexName))
            {
                return;
            }

            var tableIndex = new Index()
            {
                Name = IndexName,
                Fields = FieldBuilder.BuildForType<ProjectEntity>(),
            };
            await this.searchServiceClient.Indexes.CreateAsync(tableIndex);
        }

        /// <summary>
        /// Create data source if it doesn't exist in Azure Search service.
        /// </summary>
        /// <returns><see cref="Task"/> That represents data source is added to Azure Search service.</returns>
        private async Task CreateDataSourceAsync()
        {
            // Recreate only if there is a change in the storage schema.
            // Manually need to drop and create DataSources whenever there is storage schema design change.
            if (await this.searchServiceClient.DataSources.ExistsAsync(DataSourceName))
            {
                return;
            }

            var dataSource = DataSource.AzureTableStorage(
                DataSourceName,
                this.options.ConnectionString,
                ProjectTableName,
                query: null,
                new SoftDeleteColumnDeletionDetectionPolicy("IsRemoved", true));

            await this.searchServiceClient.DataSources.CreateAsync(dataSource);
        }

        /// <summary>
        /// Create indexer if it doesn't exist in Azure Search service.
        /// </summary>
        /// <returns><see cref="Task"/> That represents indexer is created if not available in Azure Search service.</returns>
        private async Task CreateIndexerAsync()
        {
            // Recreate only if there is a change in the storage schema.
            // Manually need to drop and create Indexers whenever there is storage schema design change.
            if (await this.searchServiceClient.Indexers.ExistsAsync(IndexerName))
            {
                return;
            }

            var indexer = new Indexer()
            {
                Name = IndexerName,
                DataSourceName = DataSourceName,
                TargetIndexName = IndexName,
            };

            await this.searchServiceClient.Indexers.CreateAsync(indexer);
            await this.searchServiceClient.Indexers.RunAsync(IndexerName);
        }

        /// <summary>
        /// Initialization of InitializeAsync method which will help in indexing.
        /// </summary>
        /// <returns>Represents an asynchronous operation.</returns>
        private Task EnsureInitializedAsync()
        {
            return this.initializeTask.Value;
        }

        /// <summary>
        /// Initialization of search service parameters which will help in searching the documents.
        /// </summary>
        /// <param name="searchScope">Scope of the search.</param>
        /// <param name="userObjectId">Azure Active Directory object id of the user.</param>
        /// <param name="count">Number of search results to return.</param>
        /// <param name="skip">Number of search results to skip.</param>
        /// <param name="filterQuery">Filter bar based query.</param>
        /// <returns>Represents an search parameter object.</returns>
        private SearchParameters InitializeSearchParameters(
            ProjectSearchScope searchScope,
            string userObjectId,
            int? count = null,
            int? skip = null,
            string filterQuery = null)
        {
            SearchParameters searchParameters = new SearchParameters()
            {
                Top = count ?? ApiSearchResultCount,
                Skip = skip ?? 0,
                IncludeTotalResultCount = false,
                Select = new[]
                {
                    nameof(ProjectEntity.ProjectId),
                    nameof(ProjectEntity.Status),
                    nameof(ProjectEntity.Title),
                    nameof(ProjectEntity.Description),
                    nameof(ProjectEntity.SupportDocuments),
                    nameof(ProjectEntity.RequiredSkills),
                    nameof(ProjectEntity.ProjectStartDate),
                    nameof(ProjectEntity.ProjectEndDate),
                    nameof(ProjectEntity.CreatedDate),
                    nameof(ProjectEntity.CreatedByName),
                    nameof(ProjectEntity.UpdatedDate),
                    nameof(ProjectEntity.CreatedByUserId),
                    nameof(ProjectEntity.TeamSize),
                    nameof(ProjectEntity.IsRemoved),
                    nameof(ProjectEntity.ProjectParticipantsUserIds),
                    nameof(ProjectEntity.ProjectParticipantsUserMapping),
                    nameof(ProjectEntity.ProjectClosedDate),
                },
                SearchFields = new[] { nameof(ProjectEntity.Title) },
                Filter = string.IsNullOrEmpty(filterQuery) ? $"({nameof(ProjectEntity.IsRemoved)} eq false)" : $"({nameof(ProjectEntity.IsRemoved)} eq false) and ({filterQuery})",
            };

            switch (searchScope)
            {
                // Get all projects.
                case ProjectSearchScope.AllProjects:
                    searchParameters.OrderBy = new[] { $"{nameof(ProjectEntity.CreatedDate)} desc" };
                    break;

                // Get user created projects.
                case ProjectSearchScope.CreatedProjectsByUser:
                    searchParameters.Filter = $"{nameof(ProjectEntity.CreatedByUserId)} eq '{userObjectId}' " + $"and ({nameof(ProjectEntity.IsRemoved)} eq false)";
                    searchParameters.OrderBy = new[] { $"{nameof(ProjectEntity.CreatedDate)} desc" };
                    break;

                // Get user  joined projects.
                case ProjectSearchScope.JoinedProjects:
                    searchParameters.OrderBy = new[] { $"{nameof(ProjectEntity.CreatedDate)} desc" };
                    searchParameters.SearchFields = new[] { nameof(ProjectEntity.ProjectParticipantsUserIds) };
                    break;

                // Get list of unique skills.
                case ProjectSearchScope.UniqueSkills:
                    searchParameters.SearchFields = new[] { nameof(ProjectEntity.RequiredSkills) };
                    searchParameters.Top = 5000;
                    searchParameters.Select = new[] { nameof(ProjectEntity.RequiredSkills) };
                    break;

                // Get filtered data as per configured skills.
                case ProjectSearchScope.FilterAsPerTeamSkills:
                    searchParameters.OrderBy = new[] { $"{nameof(ProjectEntity.UpdatedDate)} desc" };
                    searchParameters.SearchFields = new[] { nameof(ProjectEntity.RequiredSkills) };
                    break;

                // Get unique project owner names.
                case ProjectSearchScope.UniqueProjectOwnerNames:
                    searchParameters.OrderBy = new[] { $"{nameof(ProjectEntity.UpdatedDate)} desc" };
                    searchParameters.Select = new[] { nameof(ProjectEntity.CreatedByName), nameof(ProjectEntity.CreatedByUserId) };
                    break;

                // Get projects as per the skills and search text for Title/Description/Skills field.
                case ProjectSearchScope.SearchProjects:
                    searchParameters.OrderBy = new[] { $"{nameof(ProjectEntity.UpdatedDate)} desc" };
                    searchParameters.QueryType = QueryType.Full;
                    searchParameters.SearchFields = new[] { nameof(ProjectEntity.Title), nameof(ProjectEntity.Description), nameof(ProjectEntity.RequiredSkills) };
                    break;

                // Get projects as per the applied filters.
                case ProjectSearchScope.FilterTeamProjects:
                    searchParameters.OrderBy = new[] { $"{nameof(ProjectEntity.UpdatedDate)} desc" };
                    searchParameters.SearchFields = new[] { nameof(ProjectEntity.RequiredSkills) };
                    break;
            }

            return searchParameters;
        }
    }
}