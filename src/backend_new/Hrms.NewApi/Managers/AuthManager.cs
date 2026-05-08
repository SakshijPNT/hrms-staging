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

    public async Task<SessionInfoDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
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

        return new SessionInfoDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            EmailId = user.EmailId,
            CompanyId = user.CompanyId,
            CompanyName = company,
            RoleId = user.RoleId,
            RoleName = role,
        };
    }
}
