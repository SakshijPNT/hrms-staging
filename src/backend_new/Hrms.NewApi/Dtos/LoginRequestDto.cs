using System.ComponentModel.DataAnnotations;

namespace Hrms.NewApi.Dtos;

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string EmailId { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}
