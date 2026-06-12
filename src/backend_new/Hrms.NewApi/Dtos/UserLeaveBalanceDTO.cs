namespace Hrms.NewApi.Dtos;

public class UserLeaveBalanceDTO
{
    public int LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = null!;
    public decimal TotalAnnual { get; set; }
    public decimal MonthlyLeave { get; set; }
    public decimal MonthlyUsed { get; set; }
    public decimal MonthlyRemaining { get; set; }
    public decimal Used { get; set; }
    public decimal Pending { get; set; }
    public decimal AvailableBalance { get; set; }
}
