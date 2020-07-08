// <copyright file="WelcomeCard.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Cards
{
    using System;
    using System.Collections.Generic;
    using AdaptiveCards;
    using Microsoft.Bot.Schema;
    using Microsoft.Extensions.Localization;

    /// <summary>
    /// Class that helps to return welcome card as attachment.
    /// </summary>
    public static class WelcomeCard
    {
        /// <summary>
        /// Get welcome card attachment to show on Microsoft Teams channel scope.
        /// </summary>
        /// <param name="applicationBasePath">Application base path to get the logo of the application.</param>
        /// <param name="localizer">The current cultures' string localizer.</param>
        /// <returns>Team's welcome card as attachment.</returns>
        public static Attachment GetWelcomeCardAttachmentForTeam(string applicationBasePath, IStringLocalizer<Strings> localizer)
        {
            AdaptiveCard card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 2))
            {
                Body = new List<AdaptiveElement>
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
                                    new AdaptiveImage
                                    {
                                        Url = new Uri($"{applicationBasePath}/Artifacts/applicationLogo.png"),
                                        Size = AdaptiveImageSize.Medium,
                                    },
                                },
                            },
                            new AdaptiveColumn
                            {
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Weight = AdaptiveTextWeight.Bolder,
                                        Spacing = AdaptiveSpacing.None,
                                        Text = localizer.GetString("WelcomeCardTitle"),
                                        Wrap = true,
                                    },
                                    new AdaptiveTextBlock
                                    {
                                        Spacing = AdaptiveSpacing.None,
                                        Text = localizer.GetString("WelcomeCardContent"),
                                        Wrap = true,
                                        IsSubtle = true,
                                    },
                                },
                                Width = AdaptiveColumnWidth.Stretch,
                            },
                        },
                    },
                    new AdaptiveTextBlock
                    {
                        Text = localizer.GetString("WelcomeCardTeamDigestContent"),
                        Wrap = true,
                    },
                    new AdaptiveTextBlock
                    {
                        Text = localizer.GetString("WelcomeCardTeamShareContent"),
                        Wrap = true,
                    },
                },
            };

            var adaptiveCardAttachment = new Attachment()
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card,
            };

            return adaptiveCardAttachment;
        }

        /// <summary>
        /// Get welcome card attachment to show on Microsoft Teams personal scope.
        /// </summary>
        /// <param name="applicationBasePath">Application base path to get the logo of the application.</param>
        /// <param name="localizer">The current cultures' string localizer.</param>
        /// <param name="applicationManifestId">Application manifest id.</param>
        /// <param name="discoverTabEntityId">Discover tab entity id for personal Bot.</param>
        /// <returns>User welcome card attachment.</returns>
        public static Attachment GetWelcomeCardAttachmentForPersonal(
            string applicationBasePath,
            IStringLocalizer<Strings> localizer,
            string applicationManifestId,
            string discoverTabEntityId)
        {
            AdaptiveCard card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 2))
            {
                Body = new List<AdaptiveElement>
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
                                    new AdaptiveImage
                                    {
                                        Url = new Uri($"{applicationBasePath}/Artifacts/applicationLogo.png"),
                                        Size = AdaptiveImageSize.Medium,
                                    },
                                },
                            },
                            new AdaptiveColumn
                            {
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Weight = AdaptiveTextWeight.Bolder,
                                        Spacing = AdaptiveSpacing.None,
                                        Text = localizer.GetString("WelcomeCardTitle"),
                                        Wrap = true,
                                    },
                                    new AdaptiveTextBlock
                                    {
                                        Spacing = AdaptiveSpacing.None,
                                        Text = localizer.GetString("WelcomeCardContent"),
                                        Wrap = true,
                                        IsSubtle = true,
                                        Size = AdaptiveTextSize.Small,
                                    },
                                },
                                Width = AdaptiveColumnWidth.Stretch,
                            },
                        },
                    },
                    new AdaptiveTextBlock
                    {
                        Text = localizer.GetString("WelcomeCardDescriptionText"),
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                    },
                    new AdaptiveTextBlock
                    {
                        Text = localizer.GetString("WelcomeCardGetStartedText"),
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                    },
                },
                Actions = new List<AdaptiveAction>
                {
                    new AdaptiveOpenUrlAction
                    {
                        Title = localizer.GetString("PersonalWelcomeCardDiscoverButtonText"),
                        Url = new Uri($"https://teams.microsoft.com/l/entity/{applicationManifestId}/{discoverTabEntityId}"), // All projects tab (deep link).
                    },
                },
            };
            var adaptiveCardAttachment = new Attachment()
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card,
            };

            return adaptiveCardAttachment;
        }
    }
}