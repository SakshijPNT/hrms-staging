namespace Hrms.NewApi.Dtos;

public class CompanyUpdateDto
{
    public int Id { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string CompanyCode { get; set; } = string.Empty;

    public string? CompanyPhone { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? Country { get; set; }

    public string? Pincode { get; set; }

    public string? Timezone { get; set; }

    public short? FiscalYearStartMonth { get; set; }

    public short? FiscalYearStartDay { get; set; }

    public int StatusCode { get; set; }
}