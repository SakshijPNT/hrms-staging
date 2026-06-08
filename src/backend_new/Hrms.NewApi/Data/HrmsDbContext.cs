using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Data;

public class HrmsDbContext : DbContext
{
    public HrmsDbContext(DbContextOptions<HrmsDbContext> options)
        : base(options)
    {
    }

    public DbSet<CompanyMaster> CompanyMasters => Set<CompanyMaster>();
    public DbSet<RoleMaster> RoleMasters => Set<RoleMaster>();
    public DbSet<UserMaster> UserMasters => Set<UserMaster>();
    public DbSet<ActivityMaster> ActivityMasters => Set<ActivityMaster>();
    public DbSet<ActivityRoleMapping> ActivityRoleMappings => Set<ActivityRoleMapping>();
    public DbSet<ModuleMaster> ModuleMasters => Set<ModuleMaster>();
    public DbSet<ActivityModuleMapping> ActivityModuleMappings => Set<ActivityModuleMapping>();
    public DbSet<LeaveTypeMaster> LeaveTypeMasters => Set<LeaveTypeMaster>();
    public DbSet<LeaveApplication> LeaveApplications => Set<LeaveApplication>();
    public DbSet<UserLeaveBalance> UserLeaveBalances => Set<UserLeaveBalance>();
    public DbSet<UserAttendanceLog> UserAttendanceLogs => Set<UserAttendanceLog>();
    public DbSet<HolidayList> HolidayLists => Set<HolidayList>();
    public DbSet<AttendanceRegularization> AttendanceRegularizations => Set<AttendanceRegularization>();
    public DbSet<CompanyPolicies> 
    
    CompanyPolicies => Set<CompanyPolicies>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CompanyMaster>(entity =>
        {
            entity.ToTable("companymaster");
            entity.Property(x => x.CompanyName).IsRequired().HasMaxLength(200);
            entity.Property(x => x.CompanyCode).IsRequired().HasMaxLength(20);
            entity.Property(x => x.CompanyPhone).HasMaxLength(20);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.State).HasMaxLength(100);
            entity.Property(x => x.Country).HasMaxLength(100);
            entity.Property(x => x.Pincode).HasMaxLength(20);
            entity.Property(x => x.Timezone).IsRequired().HasMaxLength(60).HasDefaultValue("Asia/Kolkata");
            entity.Property(x => x.FiscalYearStartMonth).IsRequired().HasDefaultValue((short)4);
            entity.Property(x => x.FiscalYearStartDay).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => x.CompanyCode).IsUnique().HasDatabaseName("uq_companymaster_companycode");
        });

        modelBuilder.Entity<RoleMaster>(entity =>
        {
            entity.ToTable("rolemaster");
            entity.Property(x => x.RoleName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Description).HasMaxLength(255);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => new { x.CompanyId, x.RoleName }).IsUnique().HasDatabaseName("uq_rolemaster_company_rolename");
            entity.HasIndex(x => x.CompanyId).HasDatabaseName("ix_rolemaster_companyid");
        });

        modelBuilder.Entity<ActivityMaster>(entity =>
        {
            entity.ToTable("activitymaster");
            entity.Property(x => x.ActivityCode).IsRequired().HasMaxLength(50);
            entity.Property(x => x.ActivityName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Description).IsRequired().HasMaxLength(255);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => x.ActivityCode).IsUnique().HasDatabaseName("uq_activitymaster_activitycode");
        });

        modelBuilder.Entity<ModuleMaster>(entity =>
        {
            entity.ToTable("modulemaster", t =>
            {
                t.HasCheckConstraint(
                    "chk_modulemaster_parent_not_self",
                    "parentmoduleid IS NULL OR parentmoduleid <> id");
            });
            entity.Property(x => x.ParentModuleId).HasColumnName("parentmoduleid");
            entity.Property(x => x.ModuleName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Description).HasMaxLength(255);
            entity.Property(x => x.IconUrl).HasMaxLength(255);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => x.ParentModuleId).HasDatabaseName("ix_modulemaster_parentmoduleid");

            entity.HasOne(x => x.ParentModule)
                .WithMany(x => x.SubModules)
                .HasForeignKey(x => x.ParentModuleId)
                .HasConstraintName("fk_modulemaster_parent")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<UserMaster>(entity =>
        {
            entity.ToTable("usermaster");
            entity.Property(x => x.FullName).IsRequired().HasMaxLength(150);
            entity.Property(x => x.EmailId).IsRequired().HasMaxLength(150);
            entity.Property(x => x.Password).IsRequired().HasMaxLength(255);
            entity.Property(x => x.ProbationMonths).IsRequired().HasDefaultValue(0);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => x.EmailId).IsUnique().HasDatabaseName("idx_usermaster_emailid");
            entity.HasIndex(x => x.CompanyId).HasDatabaseName("idx_usermaster_companyid");
            entity.HasIndex(x => x.ManagerId).HasDatabaseName("ix_usermaster_managerid");
            entity.HasIndex(x => x.RoleId).HasDatabaseName("ix_usermaster_roleid");

            entity.HasOne<UserMaster>()
                .WithMany()
                .HasForeignKey(x => x.ManagerId)
                .HasConstraintName("fk_user_manager")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<CompanyMaster>()
                .WithMany()
                .HasForeignKey(x => x.CompanyId)
                .HasConstraintName("fk_user_company")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<RoleMaster>()
                .WithMany()
                .HasForeignKey(x => x.RoleId)
                .HasConstraintName("fk_user_role")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ActivityRoleMapping>(entity =>
        {
            entity.ToTable("activityrolemapping");
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => new { x.ActivityId, x.RoleId }).IsUnique().HasDatabaseName("uq_arm_activity_role");
            entity.HasIndex(x => x.ActivityId).HasDatabaseName("ix_activityrolemapping_activityid");
            entity.HasIndex(x => x.RoleId).HasDatabaseName("ix_activityrolemapping_roleid");

            entity.HasOne<ActivityMaster>()
                .WithMany()
                .HasForeignKey(x => x.ActivityId)
                .HasConstraintName("fk_arm_activity")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<RoleMaster>()
                .WithMany()
                .HasForeignKey(x => x.RoleId)
                .HasConstraintName("fk_arm_role")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ActivityModuleMapping>(entity =>
        {
            entity.ToTable("activitymodulemapping");
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => new { x.ModuleId, x.ActivityId }).IsUnique().HasDatabaseName("uq_amm_module_activity");
            entity.HasIndex(x => x.ModuleId).HasDatabaseName("ix_activitymodulemapping_moduleid");
            entity.HasIndex(x => x.ActivityId).HasDatabaseName("ix_activitymodulemapping_activityid");

            entity.HasOne<ModuleMaster>()
                .WithMany()
                .HasForeignKey(x => x.ModuleId)
                .HasConstraintName("fk_amm_module")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<ActivityMaster>()
                .WithMany()
                .HasForeignKey(x => x.ActivityId)
                .HasConstraintName("fk_amm_activity")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<LeaveTypeMaster>(entity =>
        {
            entity.ToTable("leavetypemaster");
            entity.Property(x => x.LeaveTypeName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Description).HasMaxLength(255);
            entity.Property(x => x.MaxDaysAllowed).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.IsCarryForward).HasDefaultValue(false);
            entity.Property(x => x.MaxCarryForward).HasPrecision(5, 1);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => new { x.CompanyId, x.LeaveTypeName }).IsUnique().HasDatabaseName("uq_ltm_company_name");
            entity.HasIndex(x => x.CompanyId).HasDatabaseName("ix_leavetypemaster_companyid");

            entity.HasOne<CompanyMaster>()
                .WithMany()
                .HasForeignKey(x => x.CompanyId)
                .HasConstraintName("fk_ltm_company")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<LeaveApplication>(entity =>
        {
            entity.Property(x => x.TotalDays).HasPrecision(5, 1);
            entity.Property(x => x.IsHalfDay).HasDefaultValue(false);
            entity.Property(x => x.Session).HasMaxLength(20);
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.Property(x => x.ApprovalStatus).IsRequired().HasMaxLength(20).HasDefaultValue("PENDING");
            entity.Property(x => x.ApproverRemark).HasMaxLength(500);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.ToTable("leaveapplications", t =>
            {
                t.HasCheckConstraint("chk_la_approvalstatus", "approvalstatus IN ('PENDING','APPROVED','REJECTED','CANCELLED')");
                t.HasCheckConstraint("chk_la_dates", "todate >= fromdate");
                t.HasCheckConstraint("chk_la_session", "session IS NULL OR session IN ('FIRST_HALF','SECOND_HALF')");
            });

            entity.HasIndex(x => x.UserId).HasDatabaseName("idx_la_userid");
            entity.HasIndex(x => x.FromDate).HasDatabaseName("idx_la_fromdate");
            entity.HasIndex(x => x.ApprovalStatus).HasDatabaseName("idx_la_status");
            entity.HasIndex(x => x.ApprovedBy).HasDatabaseName("ix_leaveapplications_approvedby");
            entity.HasIndex(x => x.LeaveTypeId).HasDatabaseName("ix_leaveapplications_leavetypeid");

            entity.HasOne<UserMaster>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .HasConstraintName("fk_la_user")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<LeaveTypeMaster>()
                .WithMany()
                .HasForeignKey(x => x.LeaveTypeId)
                .HasConstraintName("fk_la_leavetype")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<UserMaster>()
                .WithMany()
                .HasForeignKey(x => x.ApprovedBy)
                .HasConstraintName("fk_la_approver")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<UserLeaveBalance>(entity =>
        {
            entity.ToTable("userleavebalances");
            entity.Property(x => x.OpeningBalance).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.CreditedDays).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.TakenDays).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.AvailableBalance).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.MonthlyAllocation).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.MonthlyUsed).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.MonthlyPending).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.MonthlyCarryForward).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.FiscalYearCarryForwardIn).HasPrecision(5, 1).HasDefaultValue(0m);
            entity.Property(x => x.LastProcessedMonth).HasMaxLength(7);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => new { x.UserId, x.LeaveTypeId, x.CycleYear }).IsUnique().HasDatabaseName("uq_ulb_user_type_year");
            entity.HasIndex(x => x.UserId).HasDatabaseName("ix_userleavebalances_userid");
            entity.HasIndex(x => x.LeaveTypeId).HasDatabaseName("ix_userleavebalances_leavetypeid");

            entity.HasOne<UserMaster>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .HasConstraintName("fk_ulb_user")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<LeaveTypeMaster>()
                .WithMany()
                .HasForeignKey(x => x.LeaveTypeId)
                .HasConstraintName("fk_ulb_leavetype")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<UserAttendanceLog>(entity =>
        {
            entity.ToTable("userattendancelogs");
            entity.Property(x => x.AttendanceStatus).IsRequired().HasMaxLength(20);
            entity.Property(x => x.WorkedMinutes).HasDefaultValue(0);
            entity.Property(x => x.IsLate).HasDefaultValue(false);
            entity.Property(x => x.IsEarlyLeave).HasDefaultValue(false);
            entity.Property(x => x.IsRegularized).HasDefaultValue(false);
            entity.Property(x => x.Remarks).HasMaxLength(255);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => new { x.UserId, x.LogDate }).IsUnique().HasDatabaseName("uq_ual_user_date");
            entity.HasIndex(x => x.UserId).HasDatabaseName("idx_ual_userid");
            entity.HasIndex(x => x.LogDate).HasDatabaseName("idx_ual_logdate");

            entity.HasOne<UserMaster>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .HasConstraintName("fk_ual_user")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<HolidayList>(entity =>
        {
            entity.ToTable("holidaylist");
            entity.Property(x => x.HolidayName).IsRequired().HasMaxLength(150);
            entity.Property(x => x.Description).HasMaxLength(255);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => new { x.CompanyId, x.HolidayDate }).IsUnique().HasDatabaseName("uq_hl_company_date");
            entity.HasIndex(x => x.CompanyId).HasDatabaseName("ix_holidaylist_companyid");

            entity.HasOne<CompanyMaster>()
                .WithMany()
                .HasForeignKey(x => x.CompanyId)
                .HasConstraintName("fk_hl_company")
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<CompanyPolicies>(entity =>
        {
            entity.ToTable("companypolicies", t => t.HasCheckConstraint("chk_cp_shift", "shiftend > shiftstart"));
            entity.Property(x => x.WorkHours).HasPrecision(4, 2).HasDefaultValue(8.00m);
            entity.Property(x => x.HalfDayThreshold).HasPrecision(4, 2).HasDefaultValue(4.00m);
            entity.Property(x => x.CheckInGracePeriod).HasDefaultValue(15);
            entity.Property(x => x.CheckOutGracePeriod).HasDefaultValue(15);
            entity.Property(x => x.WorkDays).IsRequired().HasMaxLength(40).HasDefaultValue("MON,TUE,WED,THU,FRI");
            entity.Property(x => x.ShiftStart).HasColumnType("time").HasDefaultValue(TimeOnly.Parse("09:00:00"));
            entity.Property(x => x.ShiftEnd).HasColumnType("time").HasDefaultValue(TimeOnly.Parse("17:00:00"));
            entity.Property(x => x.RegularizationWindowDays).HasDefaultValue(30);
            entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            entity.HasIndex(x => x.CompanyId).HasDatabaseName("ix_companypolicies_companyid");

            entity.HasOne<CompanyMaster>()
                .WithMany()
                .HasForeignKey(x => x.CompanyId)
                .HasConstraintName("fk_cp_company")
                .OnDelete(DeleteBehavior.NoAction);
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                property.SetColumnName(property.Name.ToLowerInvariant());
            }
        }

        modelBuilder.Entity<CompanyPolicies>(entity =>
        {
            entity.Property(x => x.HalfDayThreshold).HasColumnName("halfday_threshold");
            entity.Property(x => x.CheckInGracePeriod).HasColumnName("checkin_graceperiod");
            entity.Property(x => x.CheckOutGracePeriod).HasColumnName("checkout_graceperiod");
        });

                modelBuilder.Entity<AttendanceRegularization>(entity =>
        {
            entity.ToTable("attendanceregularizations", t =>
            {
                t.HasCheckConstraint(
                    "chk_ar_approvalstatus",
                    "approvalstatus IN ('PENDING','APPROVED','REJECTED','CANCELLED')");
                t.HasCheckConstraint(
                    "chk_ar_original_status",
                    "originalattendancestatus IN ('ABSENT','HALF_DAY','SHORT_DAY','CHECKED_IN')");
                t.HasCheckConstraint(
                    "chk_ar_correction_type",
                    "requestedcorrectiontype IN ('FULL_DAY','HALF_DAY','SHORT_DAY','FORGOT_CHECK_IN','FORGOT_CHECK_OUT')");
                t.HasCheckConstraint(
                    "chk_ar_requested_times",
                    "requestedcheckintime IS NULL OR requestedcheckouttime IS NULL OR requestedcheckouttime > requestedcheckintime");
            });

            entity.Property(x => x.LogDate).HasColumnType("date");

            entity.Property(x => x.OriginalAttendanceStatus)
                .IsRequired()
                .HasMaxLength(20);
            entity.Property(x => x.RequestedCorrectionType)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(x => x.OriginalCheckInTime)
                .HasColumnType("timestamp with time zone");
            entity.Property(x => x.OriginalCheckOutTime)
                .HasColumnType("timestamp with time zone");
            entity.Property(x => x.RequestedCheckInTime)
                .HasColumnType("timestamp with time zone");
            entity.Property(x => x.RequestedCheckOutTime)
                .HasColumnType("timestamp with time zone");
            entity.Property(x => x.ApprovedOn)
                .HasColumnType("timestamp with time zone");

            entity.Property(x => x.Reason).IsRequired().HasMaxLength(500);
            entity.Property(x => x.ApprovalStatus)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("PENDING");
            entity.Property(x => x.ApproverRemark).HasMaxLength(500);

            entity.Property(x => x.StatusCode)
                .IsRequired()
                .HasDefaultValue((short)1);
            entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
            entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

            // Only one active PENDING request per user per date
            entity.HasIndex(x => new { x.UserId, x.LogDate })
                .IsUnique()
                .HasFilter("approvalstatus = 'PENDING' AND statuscode = 1")
                .HasDatabaseName("uq_ar_user_date_pending");

            entity.HasIndex(x => x.UserId)
                .HasDatabaseName("idx_ar_userid");
            entity.HasIndex(x => x.LogDate)
                .HasDatabaseName("idx_ar_logdate");
            entity.HasIndex(x => x.ApprovalStatus)
                .HasDatabaseName("idx_ar_approvalstatus");
            entity.HasIndex(x => x.ApprovedBy)
                .HasDatabaseName("ix_ar_approvedby");
            entity.HasIndex(x => x.AttendanceLogId)
                .HasDatabaseName("ix_ar_attendancelogid");

            entity.HasOne<UserMaster>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .HasConstraintName("fk_ar_user")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<UserAttendanceLog>()
                .WithMany()
                .HasForeignKey(x => x.AttendanceLogId)
                .HasConstraintName("fk_ar_attendance_log")
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<UserMaster>()
                .WithMany()
                .HasForeignKey(x => x.ApprovedBy)
                .HasConstraintName("fk_ar_approver")
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
