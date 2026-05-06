using Hrms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Data;

public sealed class HrmsDbContext(DbContextOptions<HrmsDbContext> options) : DbContext(options)
{
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RoleActivity> RoleActivities => Set<RoleActivity>();
    public DbSet<User> Users => Set<User>();
    public DbSet<EmployeeProfile> EmployeeProfiles => Set<EmployeeProfile>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<EmployeeRequest> Requests => Set<EmployeeRequest>();

    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Disambiguate UserPermission FKs
        modelBuilder.Entity<UserPermission>()
            .HasOne(up => up.User)
            .WithMany()
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserPermission>()
            .HasOne(up => up.AssignedByUser)
            .WithMany()
            .HasForeignKey(up => up.AssignedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Disambiguate RolePermission FKs
        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.AssignedByUser)
            .WithMany()
            .HasForeignKey(rp => rp.AssignedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HrmsDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<Domain.Common.BaseEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedUtc = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}