namespace Hrms.NewApi.Dtos;

public class UserLeaveBalanceDetailDto
{
    public int LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = null!;
    public decimal AnnualUsed { get; set; }
    public decimal AnnualPending { get; set; }
    public decimal MonthlyUsed { get; set; }
    public decimal MonthlyPending { get; set; }
}
