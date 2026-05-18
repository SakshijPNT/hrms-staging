namespace Hrms.NewApi.Dtos;

public class CompanyListItemDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = null!;
    public string Timezone { get; set; } = null!;
    public short StatusCode { get; set; }
    public string? Country { get; set; }
}
