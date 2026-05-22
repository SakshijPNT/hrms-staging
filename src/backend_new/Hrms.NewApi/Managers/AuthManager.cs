using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class AuthManager : IAuthManager
{
    private readonly HrmsDbContext _db;
    private readonly IPasswordHasher<UserMaster> _passwordHasher;

    public AuthManager(HrmsDbContext db, IPasswordHasher<UserMaster> passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<(SessionInfoDto Session, LoginResponseDto Response)> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _db.UserMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.EmailId == request.EmailId && u.StatusCode == 1, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        var result = _passwordHasher.VerifyHashedPassword(user, user.Password, request.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var company = await _db.CompanyMasters
            .AsNoTracking()
            .Where(c => c.Id == user.CompanyId)
            .Select(c => c.CompanyName)
            .FirstAsync(cancellationToken);

        var role = await _db.RoleMasters
            .AsNoTracking()
            .Where(r => r.Id == user.RoleId)
            .Select(r => r.RoleName)
            .FirstAsync(cancellationToken);

        var activities = await (
            from arm in _db.ActivityRoleMappings
            join am in _db.ActivityMasters on arm.ActivityId equals am.Id
            where arm.RoleId == user.RoleId && arm.StatusCode == 1 && am.StatusCode == 1
            select new ActivityDto
            {
                Id = am.Id,
                ActivityCode = am.ActivityCode,
                ActivityName = am.ActivityName,
                Description = am.Description,
            }
        ).AsNoTracking().ToListAsync(cancellationToken);

        var activityIds = activities.Select(a => a.Id).ToHashSet();

       var modules = await _db.ModuleMasters
    .AsNoTracking()
    .Where(mm => mm.StatusCode == 1)
    .ToListAsync(cancellationToken);

var groupedModules = modules
    .Where(parent => parent.ParentModuleId == null)
    .Select(parent => new ModuleGroupDto
    {
        GroupId = parent.Id,

        GroupName = parent.ModuleName,

        Modules = modules
            .Where(child => child.ParentModuleId == parent.Id)
            .Select(child => new ModuleItemDto
            {
                Id = child.Id,
                ModuleName = child.ModuleName,
                Description = child.Description,
                IconUrl = child.IconUrl,
            })
            .ToList()
    })
    .Where(g => g.Modules.Any())
    .ToList();


// ADD standalone modules also
var standaloneModules = modules
    .Where(x =>
        x.ParentModuleId == null &&
        !modules.Any(c => c.ParentModuleId == x.Id))
    .Select(x => new ModuleGroupDto
    {
        GroupId = x.Id,

        GroupName = x.ModuleName,

        Modules = new List<ModuleItemDto>
        {
            new ModuleItemDto
            {
                Id = x.Id,
                ModuleName = x.ModuleName,
                Description = x.Description,
                IconUrl = x.IconUrl,
            }
        }
    })
    .ToList();

groupedModules.AddRange(standaloneModules);

        var session = new SessionInfoDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            EmailId = user.EmailId,
            CompanyId = user.CompanyId,
            CompanyName = company,
            RoleId = user.RoleId,
            RoleName = role,
        };

        var response = new LoginResponseDto
        {
            Groups = groupedModules,
            Activities = activities,
        };

        return (session, response);
    }
}
