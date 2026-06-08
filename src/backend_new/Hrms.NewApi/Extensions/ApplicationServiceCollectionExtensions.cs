using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Managers;
using Hrms.NewApi.Models;
using Microsoft.AspNetCore.Identity;

namespace Hrms.NewApi.Extensions;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IPasswordHasher<UserMaster>, PasswordHasher<UserMaster>>();
        services.AddScoped<IUserManager, UserManager>();
        services.AddScoped<IAuthManager, AuthManager>();
        services.AddScoped<IRoleManager, RoleManager>();
        services.AddScoped<IUserLeaveManager, UserLeaveManager>();
        services.AddScoped<ICompanyManager, CompanyManager>();
        services.AddScoped<IAttendanceManager, AttendanceManager>();
        services.AddScoped<IPolicyManager, PolicyManager>();
        services.AddScoped<IHolidayManager, HolidayManager>();
        services.AddScoped<ILeaveTypeManager, LeaveTypeManager>();
        services.AddScoped<ICalendarManager, CalendarManager>();
        services.AddScoped<IRegularizationManager, RegularizationManager>();
        return services;
    }
}
