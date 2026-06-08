namespace Hrms.NewApi.Dtos;

public class LeaveApplicationMonthlyPreviewDto
{
    public decimal TotalDays { get; set; }
    public decimal MonthlyAvailable { get; set; }
    public bool ExceedsMonthlyLimit { get; set; }
    public decimal ExcessDays { get; set; }
    public string? WarningMessage { get; set; }
}
