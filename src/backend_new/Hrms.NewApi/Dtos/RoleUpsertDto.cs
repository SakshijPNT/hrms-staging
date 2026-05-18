using System.ComponentModel.DataAnnotations;

namespace Hrms.NewApi.Dtos;

public class RoleUpsertDto
{
    [Required]
    [MaxLength(100)]
    public string RoleName { get; set; } = null!;

    public int? CompanyId { get; set; }

    [MaxLength(255)]
    public string? Description { get; set; }

    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }

    public List<int> ActivityIds { get; set; } = new();
}
