using Hrms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrms.Infrastructure.Data.Configurations;

public sealed class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.ToTable("Activities");
        builder.HasKey(activity => activity.Id);
        builder.Property(activity => activity.Name).HasMaxLength(100).IsRequired();
        builder.Property(activity => activity.Code).HasMaxLength(100).IsRequired();
        builder.Property(activity => activity.Description).HasMaxLength(400).IsRequired();
        builder.Property(activity => activity.Type).HasMaxLength(50).IsRequired();
        builder.Property(activity => activity.ModuleCode).HasMaxLength(50).IsRequired(false);
        builder.Property(activity => activity.ModuleName).HasMaxLength(100).IsRequired(false);
        builder.HasIndex(activity => activity.Name).IsUnique();
        builder.HasIndex(activity => activity.Code).IsUnique();
    }
}