// <copyright file="CarouselCard.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Cards
{
    using System.Collections.Generic;
    using System.Globalization;
    using Microsoft.Bot.Schema;

    /// <summary>
    /// Carousal card for help command.
    /// </summary>
    public static class CarouselCard
    {
        /// <summary>
        /// Create the set of cards that comprise the user help carousel.
        /// </summary>
        /// <param name="applicationBasePath">Application base path to get the logo of the application.</param>
        /// <returns>The cards that comprise the user tour.</returns>
        public static IEnumerable<Attachment> GetUserHelpCards(string applicationBasePath)
        {
            return new List<Attachment>()
            {
                GetCarouselCards(string.Empty, Strings.CarouselCard1Text, applicationBasePath + "/Artifacts/carouselImage1.jpg"),
                GetCarouselCards(string.Empty, Strings.CarouselCard2Text, applicationBasePath + "/Artifacts/carouselImage2.jpg"),
                GetCarouselCards(string.Empty, string.Format(CultureInfo.InvariantCulture, Strings.CarouselCard3Text, $"{Strings.ApplicationName}"), applicationBasePath + "/Artifacts/carouselImage3.jpg"),
            };
        }

        private static Attachment GetCarouselCards(string title, string text, string imageUri)
        {
            HeroCard userHelpCarouselCard = new HeroCard()
            {
                Title = title,
                Text = text,
                Images = new List<CardImage>()
                {
                    new CardImage(imageUri),
                },
            };

            return userHelpCarouselCard.ToAttachment();
        }
    }
}
