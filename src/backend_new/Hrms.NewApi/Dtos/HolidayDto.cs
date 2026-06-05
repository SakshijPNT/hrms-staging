namespace Hrms.NewApi.Dtos;

public class HolidayCreateDto
{
    public int CompanyId { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = null!;
    public string? Description { get; set; }
}

public class HolidayUpdateDto
{
    public int Id { get; set; }
    public string HolidayName { get; set; } = null!;
    public string? Description { get; set; }
}

public class HolidayResponseDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = null!;
    public string? Description { get; set; }
}

public class HolidayBulkItemDto
{
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = null!;
    public string? Description { get; set; }
}

public class HolidayBulkCreateDto
{
    public int CompanyId { get; set; }
    public IReadOnlyList<HolidayBulkItemDto> Holidays { get; set; } = Array.Empty<HolidayBulkItemDto>();
}
