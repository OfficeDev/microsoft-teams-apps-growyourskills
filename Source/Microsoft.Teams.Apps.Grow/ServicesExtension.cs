// <copyright file="ServicesExtension.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow
{
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Localization;
    using Microsoft.Azure.Search;
    using Microsoft.Bot.Builder;
    using Microsoft.Bot.Builder.Azure;
    using Microsoft.Bot.Builder.BotFramework;
    using Microsoft.Bot.Connector.Authentication;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Teams.Apps.Grow.Bot;
    using Microsoft.Teams.Apps.Grow.Common.Interfaces;
    using Microsoft.Teams.Apps.Grow.Common.Providers;
    using Microsoft.Teams.Apps.Grow.Common.SearchServices;
    using Microsoft.Teams.Apps.Grow.Helpers;
    using Microsoft.Teams.Apps.Grow.Models;
    using Microsoft.Teams.Apps.Grow.Models.Configuration;

    /// <summary>
    /// Class which helps to extend ServiceCollection.
    /// </summary>
    public static class ServicesExtension
    {
        /// <summary>
        /// Azure Search service index name for project.
        /// </summary>
        private const string ProjectIndexName = "grow-project-index";

        /// <summary>
        /// Adds application configuration settings to specified IServiceCollection.
        /// </summary>
        /// <param name="services">Collection of services.</param>
        /// <param name="configuration">Application configuration properties.</param>
        public static void AddConfigurationSettings(this IServiceCollection services, IConfiguration configuration)
        {
            string appBaseUrl = configuration.GetValue<string>("App:AppBaseUri");
            string discoverTabEntityId = configuration.GetValue<string>("DiscoverTabEntityId");

            services.Configure<BotSettings>(options =>
            {
                options.AppBaseUri = appBaseUrl;
                options.TenantId = configuration.GetValue<string>("App:TenantId");
                options.RetryCount = configuration.GetValue<int>("RetryPolicy:retryCount");
                options.ManifestId = configuration.GetValue<string>("App:ManifestId");
                options.CacheDurationInMinutes = configuration.GetValue<double>("App:CacheDurationInMinutes");
            });

            services.Configure<AzureActiveDirectorySettings>(options =>
            {
                options.TenantId = configuration.GetValue<string>("AzureAd:TenantId");
                options.ClientId = configuration.GetValue<string>("AzureAd:ClientId");
            });

            services.Configure<TelemetrySetting>(options =>
            {
                options.InstrumentationKey = configuration.GetValue<string>("ApplicationInsights:InstrumentationKey");
            });

            services.Configure<StorageSetting>(options =>
            {
                options.ConnectionString = configuration.GetValue<string>("Storage:ConnectionString");
            });

            services.Configure<SearchServiceSetting>(searchServiceSettings =>
            {
                searchServiceSettings.SearchServiceName = configuration.GetValue<string>("SearchService:SearchServiceName");
                searchServiceSettings.SearchServiceQueryApiKey = configuration.GetValue<string>("SearchService:SearchServiceQueryApiKey");
                searchServiceSettings.SearchServiceAdminApiKey = configuration.GetValue<string>("SearchService:SearchServiceAdminApiKey");
                searchServiceSettings.ConnectionString = configuration.GetValue<string>("Storage:ConnectionString");
            });
        }

        /// <summary>
        /// Adds helpers to specified IServiceCollection.
        /// </summary>
        /// <param name="services">Collection of services.</param>
        /// <param name="configuration">Application configuration properties.</param>
        public static void AddHelpers(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddApplicationInsightsTelemetry(configuration.GetValue<string>("ApplicationInsights:InstrumentationKey"));

            services.AddSingleton<IProjectStorageProvider, ProjectStorageProvider>();
            services.AddSingleton<IAcquiredSkillStorageProvider, AcquiredSkillStorageProvider>();
            services.AddSingleton<IUserDetailProvider, UserDetailProvider>();

            services.AddSingleton<IProjectSearchService, ProjectSearchService>();

            services.AddSingleton<IMessagingExtensionHelper, MessagingExtensionHelper>();
            services.AddSingleton<ProjectStatusHelper>();
            services.AddSingleton<IProjectHelper, ProjectHelper>();
            services.AddSingleton<ITeamSkillHelper, TeamSkillHelper>();
            services.AddSingleton<ITeamSkillStorageProvider, TeamSkillStorageProvider>();
            services.AddSingleton<NotificationHelper>();
            services.AddSingleton<ITeamStorageProvider, TeamStorageProvider>();
            services.AddSingleton<ITeamsInfoHelper, TeamsInfoHelper>();

            // services.AddHostedService<TeamPostDataRefreshService>();
#pragma warning disable CA2000 // Disposing it in Search Service.
            services.AddSingleton<ISearchServiceClient>(new SearchServiceClient(configuration.GetValue<string>("SearchService:SearchServiceName"), new SearchCredentials(configuration.GetValue<string>("SearchService:SearchServiceAdminApiKey"))));
#pragma warning restore CA2000 // Disposing it in Search Service.
#pragma warning disable CA2000 // Disposing it in Search Service.
            services.AddSingleton<ISearchIndexClient>(new SearchIndexClient(configuration.GetValue<string>("SearchService:SearchServiceName"), ProjectIndexName, new SearchCredentials(configuration.GetValue<string>("SearchService:SearchServiceQueryApiKey"))));
#pragma warning restore CA2000 // Disposing it in Search Service.
        }

        /// <summary>
        /// Adds user state and conversation state to specified IServiceCollection.
        /// </summary>
        /// <param name="services">Collection of services.</param>
        /// <param name="configuration">Application configuration properties.</param>
        public static void AddBotStates(this IServiceCollection services, IConfiguration configuration)
        {
            // Create the User state. (Used in this bot's Dialog implementation.)
            services.AddSingleton<UserState>();

            // Create the Conversation state. (Used by the Dialog system itself.)
            services.AddSingleton<ConversationState>();

            // For conversation state.
            services.AddSingleton<IStorage>(new AzureBlobStorage(configuration.GetValue<string>("Storage:ConnectionString"), "bot-state"));
        }

        /// <summary>
        /// Adds localization.
        /// </summary>
        /// <param name="services">Collection of services.</param>
        /// <param name="configuration">Application configuration properties.</param>
        public static void AddLocalization(this IServiceCollection services, IConfiguration configuration)
        {
            // Add i18n.
            services.AddLocalization(options => options.ResourcesPath = "Resources");

            services.Configure<RequestLocalizationOptions>(options =>
            {
                var defaultCulture = CultureInfo.GetCultureInfo(configuration.GetValue<string>("i18n:DefaultCulture"));
                var supportedCultures = configuration.GetValue<string>("i18n:SupportedCultures").Split(',')
                    .Select(culture => CultureInfo.GetCultureInfo(culture))
                    .ToList();

                options.DefaultRequestCulture = new RequestCulture(defaultCulture);
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedCultures;

                options.RequestCultureProviders = new List<IRequestCultureProvider>
                {
                    new GrowLocalizationCultureProvider(),
                };
            });
        }

        /// <summary>
        /// Adds credential providers for authentication.
        /// </summary>
        /// <param name="services">Collection of services.</param>
        /// <param name="configuration">Application configuration properties.</param>
        public static void AddCredentialProviders(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<ICredentialProvider, ConfigurationCredentialProvider>();
            services.AddSingleton(new MicrosoftAppCredentials(configuration.GetValue<string>("MicrosoftAppId"), configuration.GetValue<string>("MicrosoftAppPassword")));
        }
    }
}