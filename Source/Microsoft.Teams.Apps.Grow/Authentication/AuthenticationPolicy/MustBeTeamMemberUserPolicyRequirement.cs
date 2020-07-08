// <copyright file="MustBeTeamMemberUserPolicyRequirement.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

namespace Microsoft.Teams.Apps.Grow.Authentication.AuthenticationPolicy
{
    using Microsoft.AspNetCore.Authorization;

    /// <summary>
    /// This authorization class implements the marker interface
    /// <see cref="IAuthorizationRequirement"/> to check if user meets teams member specific requirements
    /// for accesing resources.
    /// </summary>
    public class MustBeTeamMemberUserPolicyRequirement : IAuthorizationRequirement
    {
    }
}
