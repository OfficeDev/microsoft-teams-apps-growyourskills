// <copyright file="PolicyNames.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Authentication.AuthenticationPolicy
{
    /// <summary>
    /// This class list the policy name of custom authorizations implemented in project.
    /// </summary>
    public static class PolicyNames
    {
        /// <summary>
        /// The name of the authorization policy, MustBeTeamMemberUserPolicy.
        /// Indicates that user is a part of team and has permission to edit created project.
        /// </summary>
        public const string MustBeTeamMemberUserPolicy = "MustBeTeamMemberUserPolicy";
    }
}
