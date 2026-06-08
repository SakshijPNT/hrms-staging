namespace Hrms.NewApi.Dtos;

public class ManagerLeaveApplicationListItemDto : UserLeaveApplicationListItemDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public int LeaveTypeId { get; set; }
}
