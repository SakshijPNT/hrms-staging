using System;

namespace Hrms.NewApi.Models;

public class CompanyMaster
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = null!;
    public string CompanyCode { get; set; } = null!;
    public string? CompanyPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? Pincode { get; set; }
    public string Timezone { get; set; } = "Asia/Kolkata";
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class RoleMaster
{
    public int Id { get; set; }
    public string RoleName { get; set; } = null!;
    public int CompanyId { get; set; }
    public string? Description { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }

    
}

public class UserMaster
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string EmailId { get; set; } = null!;
    public string Password { get; set; } = null!;
    public int? ManagerId { get; set; }
    public int CompanyId { get; set; }
    public int RoleId { get; set; }
    public DateOnly JoiningDate { get; set; }
    public int ProbationMonths { get; set; }
    public DateOnly? ConfirmationDate { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class ActivityMaster
{
    public int Id { get; set; }
    public string ActivityCode { get; set; } = null!;
    public string ActivityName { get; set; } = null!;
    public string Description { get; set; } = null!;
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class ActivityRoleMapping
{
    public int Id { get; set; }
    public int ActivityId { get; set; }
    public int RoleId { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class ModuleMaster
{
    public int Id { get; set; }
    public string ModuleName { get; set; } = null!;
    public int? ParentModuleId { get; set; }
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
    public ModuleMaster? ParentModule { get; set; }

    public ICollection<ModuleMaster> SubModules { get; set; }
        = new List<ModuleMaster>();
}

public class ActivityModuleMapping
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public int ActivityId { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class LeaveTypeMaster
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string LeaveTypeName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal MaxDaysAllowed { get; set; }
    public bool IsCarryForward { get; set; }
    public decimal? MaxCarryForward { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class LeaveApplication
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LeaveTypeId { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public decimal TotalDays { get; set; }
    public bool IsHalfDay { get; set; }
    public string? Session { get; set; }
    public string? Reason { get; set; }
    public string ApprovalStatus { get; set; } = "PENDING";
    public int? ApprovedBy { get; set; }
    public DateTimeOffset? ApprovedOn { get; set; }
    public string? ApproverRemark { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class UserLeaveBalance
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LeaveTypeId { get; set; }
    public short CycleYear { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal CreditedDays { get; set; }
    public decimal TakenDays { get; set; }
    public decimal AvailableBalance { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class UserAttendanceLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly LogDate { get; set; }
    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }
    public int WorkedMinutes { get; set; }
    public string AttendanceStatus { get; set; } = null!;
    public bool IsLate { get; set; }
    public bool IsEarlyLeave { get; set; }
    public string? Remarks { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class HolidayList
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = null!;
    public string? Description { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class CompanyPolicies
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public decimal WorkHours { get; set; } = 8.00m;
    public decimal HalfDayThreshold { get; set; } = 4.00m;
    public int CheckInGracePeriod { get; set; } = 15;
    public int CheckOutGracePeriod { get; set; } = 15;
    public string WorkDays { get; set; } = "MON,TUE,WED,THU,FRI";
    public TimeOnly ShiftStart { get; set; } = TimeOnly.Parse("09:00:00");
    public TimeOnly ShiftEnd { get; set; } = TimeOnly.Parse("17:00:00");
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}

public class AttendanceRegularization
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly LogDate { get; set; }
    /// <summary>Optional link to existing user_attendance_logs row for that date.</summary>
    public int? AttendanceLogId { get; set; }
    public DateTimeOffset? OriginalCheckInTime { get; set; }
    public DateTimeOffset? OriginalCheckOutTime { get; set; }
    public DateTimeOffset RequestedCheckInTime { get; set; }
    public DateTimeOffset RequestedCheckOutTime { get; set; }
    public string Reason { get; set; } = null!;
    public string ApprovalStatus { get; set; } = "PENDING";
    public int? ApprovedBy { get; set; }
    public DateTimeOffset? ApprovedOn { get; set; }
    public string? ApproverRemark { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}
