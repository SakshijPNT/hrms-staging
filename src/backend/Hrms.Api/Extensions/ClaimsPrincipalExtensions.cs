using System.Security.Claims;

namespace Hrms.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var rawValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Authenticated user id is missing from the token.");

        return Guid.Parse(rawValue);
    }

    public static bool HasElevatedAccess(this ClaimsPrincipal principal)
    {
        return principal.IsInRole("Admin") || principal.IsInRole("Supervisor");
    }
}