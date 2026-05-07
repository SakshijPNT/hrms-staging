namespace Hrms.NewApi.Dtos;

public class RoleResponseDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = null!;
    public int CompanyId { get; set; }
    public string? Description { get; set; }
    public short StatusCode { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}
