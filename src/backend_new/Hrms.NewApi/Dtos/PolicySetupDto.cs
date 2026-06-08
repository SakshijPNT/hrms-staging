namespace Hrms.NewApi.Dtos;

public class HolidaySyncItemDto
{
    public int? Id { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = null!;
    public string? Description { get; set; }
}

public class PolicySetupCreateDto
{
    public PolicyCreateDto Policy { get; set; } = null!;
    public int HolidayYear { get; set; }
    public IReadOnlyList<HolidaySyncItemDto> Holidays { get; set; } = Array.Empty<HolidaySyncItemDto>();
    public IReadOnlyList<LeaveTypeSyncItemDto> LeaveTypes { get; set; } = Array.Empty<LeaveTypeSyncItemDto>();
}

public class PolicySetupUpdateDto
{
    public PolicyUpdateDto Policy { get; set; } = null!;
    public int HolidayYear { get; set; }
    public IReadOnlyList<HolidaySyncItemDto> Holidays { get; set; } = Array.Empty<HolidaySyncItemDto>();
    public IReadOnlyList<LeaveTypeSyncItemDto> LeaveTypes { get; set; } = Array.Empty<LeaveTypeSyncItemDto>();
}

public class PolicySetupResponseDto
{
    public PolicyResponseDto Policy { get; set; } = null!;
    public string Message { get; set; } = "Policy setup saved successfully.";
}

public class PolicyCompanyContextDto
{
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = null!;
    public string Timezone { get; set; } = null!;
}
