using Hrms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrms.Infrastructure.Data.Configurations;

public sealed class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> builder)
    {
        builder.ToTable("Attendance");
        builder.HasKey(record => record.Id);
        builder.Property(record => record.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(record => record.Notes).HasMaxLength(500);
        builder.HasIndex(record => new { record.UserId, record.WorkDate }).IsUnique();
        builder.HasOne(record => record.User)
            .WithMany(user => user.AttendanceRecords)
            .HasForeignKey(record => record.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}