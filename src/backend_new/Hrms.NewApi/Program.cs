using Hrms.NewApi.Data;
using Hrms.NewApi.Extensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray() ?? [];

if (allowedOrigins.Length == 0)
{
    allowedOrigins = ["http://localhost:5173"];
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = false;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplicationServices();

var app = builder.Build();

app.Logger.LogInformation(
    "CORS allowed origins: {Origins}",
    string.Join(", ", allowedOrigins));

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<HrmsDbContext>();
    try
    {
        app.Logger.LogInformation("Applying database migrations...");
        dbContext.Database.Migrate();
        SyncUserLeaveBalancesIdSequence(dbContext);
        app.Logger.LogInformation("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Migration failed. Check your connection string and that the database is reachable.");
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseSession();
app.MapControllers();
app.Run();

static void SyncUserLeaveBalancesIdSequence(HrmsDbContext dbContext)
{
    dbContext.Database.ExecuteSqlRaw(
        """
        DO $$
        DECLARE
            sequence_name text;
            max_id bigint;
        BEGIN
            SELECT pg_get_serial_sequence('userleavebalances', 'id') INTO sequence_name;

            IF sequence_name IS NULL THEN
                RETURN;
            END IF;

            SELECT COALESCE(MAX(id), 0) INTO max_id FROM userleavebalances;

            IF max_id = 0 THEN
                PERFORM setval(sequence_name, 1, false);
            ELSE
                PERFORM setval(sequence_name, max_id, true);
            END IF;
        END $$;
        """);
}
