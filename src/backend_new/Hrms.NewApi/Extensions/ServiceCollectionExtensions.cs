using Hrms.NewApi.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["DATABASE_URL"]
            ?? throw new InvalidOperationException("The database connection string was not found. Set ConnectionStrings:DefaultConnection or DATABASE_URL.");

        services.AddDbContext<HrmsDbContext>(options => options.UseNpgsql(connectionString));
        return services;
    }
}
