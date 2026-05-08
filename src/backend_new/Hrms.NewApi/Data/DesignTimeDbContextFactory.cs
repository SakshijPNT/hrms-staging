using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Hrms.NewApi.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<HrmsDbContext>
{
    // This factory is used by the EF Core CLI tools (dotnet ef) when no
    // DbContext is available from application startup. It creates the context
    // with the same connection string and provider configuration used by the app.
    public HrmsDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<HrmsDbContext>();
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["DATABASE_URL"]
            ?? throw new InvalidOperationException("The database connection string was not found.");

        // Use the PostgreSQL provider with the same connection string as the application.
        optionsBuilder.UseNpgsql(connectionString);
        return new HrmsDbContext(optionsBuilder.Options);
    }
}
