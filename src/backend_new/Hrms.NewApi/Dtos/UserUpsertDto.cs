using System.ComponentModel.DataAnnotations;

namespace Hrms.NewApi.Dtos;

public class UserUpsertDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string EmailId { get; set; } = null!;

    [Required]
    [MaxLength(255)]
    public string Password { get; set; } = null!;

    public int? ManagerId { get; set; }

    [Required]
    public int CompanyId { get; set; }

    [Required]
    public int RoleId { get; set; }

    [Required]
    public DateOnly JoiningDate { get; set; }

    public int ProbationMonths { get; set; }
    public DateOnly? ConfirmationDate { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }
}
