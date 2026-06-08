using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Support;

public static class CuratedTimezones
{
    public const string Default = "Asia/Kolkata";

    private static readonly IReadOnlyList<TimezoneOptionDto> Options =
    [
        new() { Value = "Asia/Kolkata", Label = "Asia/Kolkata (IST)" },
        new() { Value = "UTC", Label = "UTC" },
        new() { Value = "Asia/Dubai", Label = "Asia/Dubai (GST)" },
        new() { Value = "Asia/Singapore", Label = "Asia/Singapore (SGT)" },
        new() { Value = "Asia/Tokyo", Label = "Asia/Tokyo (JST)" },
        new() { Value = "Asia/Bangkok", Label = "Asia/Bangkok (ICT)" },
        new() { Value = "Asia/Karachi", Label = "Asia/Karachi (PKT)" },
        new() { Value = "Europe/London", Label = "Europe/London (GMT/BST)" },
        new() { Value = "Europe/Paris", Label = "Europe/Paris (CET)" },
        new() { Value = "Europe/Berlin", Label = "Europe/Berlin (CET)" },
        new() { Value = "America/New_York", Label = "America/New_York (ET)" },
        new() { Value = "America/Chicago", Label = "America/Chicago (CT)" },
        new() { Value = "America/Denver", Label = "America/Denver (MT)" },
        new() { Value = "America/Los_Angeles", Label = "America/Los_Angeles (PT)" },
        new() { Value = "America/Toronto", Label = "America/Toronto (ET)" },
        new() { Value = "Australia/Sydney", Label = "Australia/Sydney (AEST)" },
        new() { Value = "Pacific/Auckland", Label = "Pacific/Auckland (NZST)" },
        new() { Value = "Africa/Johannesburg", Label = "Africa/Johannesburg (SAST)" },
    ];

    public static IReadOnlyList<TimezoneOptionDto> GetAll() => Options;

    public static bool IsAllowed(string? timezone)
    {
        if (string.IsNullOrWhiteSpace(timezone))
        {
            return false;
        }

        var normalized = timezone.Trim();
        return Options.Any(option =>
            string.Equals(option.Value, normalized, StringComparison.Ordinal));
    }
}
