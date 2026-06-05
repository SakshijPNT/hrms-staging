using System.ComponentModel.DataAnnotations;

namespace Hrms.NewApi.Dtos;

public class CompanyCreateDto
{
    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    public string CompanyCode { get; set; } = null!;

    [MaxLength(20)]
    public string? CompanyPhone { get; set; }

    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(20)]
    public string? Pincode { get; set; }

    [MaxLength(60)]
    public string Timezone { get; set; } = "Asia/Kolkata";

    public short StatusCode { get; set; } = 1;

    public IReadOnlyList<HolidayBulkItemDto> Holidays { get; set; } = Array.Empty<HolidayBulkItemDto>();
}
