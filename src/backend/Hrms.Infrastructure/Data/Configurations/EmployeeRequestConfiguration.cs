using Hrms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrms.Infrastructure.Data.Configurations;

public sealed class EmployeeRequestConfiguration : IEntityTypeConfiguration<EmployeeRequest>
{
    public void Configure(EntityTypeBuilder<EmployeeRequest> builder)
    {
        builder.ToTable("Requests");
        builder.HasKey(request => request.Id);
        builder.Property(request => request.Title).HasMaxLength(150).IsRequired();
        builder.Property(request => request.Description).HasMaxLength(1000).IsRequired();
        builder.Property(request => request.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(request => request.DecisionNotes).HasMaxLength(500);
        builder.HasOne(request => request.User)
            .WithMany(user => user.Requests)
            .HasForeignKey(request => request.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}