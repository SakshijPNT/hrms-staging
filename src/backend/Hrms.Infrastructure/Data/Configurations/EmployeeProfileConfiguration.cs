using Hrms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrms.Infrastructure.Data.Configurations;

public sealed class EmployeeProfileConfiguration : IEntityTypeConfiguration<EmployeeProfile>
{
    public void Configure(EntityTypeBuilder<EmployeeProfile> builder)
    {
        builder.ToTable("EmployeeProfile");
        builder.HasKey(profile => profile.Id);
        builder.Property(profile => profile.EmployeeCode).HasMaxLength(30).IsRequired();
        builder.Property(profile => profile.Department).HasMaxLength(100).IsRequired();
        builder.Property(profile => profile.JobTitle).HasMaxLength(120).IsRequired();
        builder.Property(profile => profile.PhoneNumber).HasMaxLength(20);
        builder.HasIndex(profile => profile.EmployeeCode).IsUnique();
        builder.HasOne(profile => profile.User)
            .WithOne(user => user.EmployeeProfile)
            .HasForeignKey<EmployeeProfile>(profile => profile.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}