namespace Hrms.NewApi.Dtos;

public class CompanyResponseDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = null!;
    public string CompanyCode { get; set; } = null!;
    public string? CompanyPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? Pincode { get; set; }
    public string Timezone { get; set; } = null!;
    public short FiscalYearStartMonth { get; set; }
    public short FiscalYearStartDay { get; set; }
    public short StatusCode { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}
