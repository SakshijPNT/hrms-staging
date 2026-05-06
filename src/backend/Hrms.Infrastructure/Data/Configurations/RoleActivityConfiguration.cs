using Hrms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrms.Infrastructure.Data.Configurations;

public sealed class RoleActivityConfiguration : IEntityTypeConfiguration<RoleActivity>
{
    public void Configure(EntityTypeBuilder<RoleActivity> builder)
    {
        builder.ToTable("RoleActivities");
        builder.HasKey(roleActivity => new { roleActivity.RoleId, roleActivity.ActivityId });

        builder.HasOne(roleActivity => roleActivity.Role)
            .WithMany(role => role.RoleActivities)
            .HasForeignKey(roleActivity => roleActivity.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(roleActivity => roleActivity.Activity)
            .WithMany(activity => activity.RoleActivities)
            .HasForeignKey(roleActivity => roleActivity.ActivityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}