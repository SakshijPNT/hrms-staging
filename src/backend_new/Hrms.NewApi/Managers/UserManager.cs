using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class UserManager : IUserManager
{
    private readonly HrmsDbContext _dbContext;
    private readonly IPasswordHasher<UserMaster> _passwordHasher;
    private const string DefaultPassword = "Welcome@123";
    public UserManager(HrmsDbContext dbContext, IPasswordHasher<UserMaster> passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserResponseDto> CreateUserAsync(UserUpsertDto request, CancellationToken cancellationToken = default)
    {
        await ValidateUserReferencesAsync(request, currentUserId: null, cancellationToken);

        var user = new UserMaster
        {
            FullName = request.FullName,
            EmailId = request.EmailId,
            ManagerId = request.ManagerId,
            CompanyId = request.CompanyId,
            RoleId = request.RoleId,
            JoiningDate = request.JoiningDate,
            ProbationMonths = request.ProbationMonths,
            ConfirmationDate = request.ConfirmationDate,
            StatusCode = request.StatusCode,
            CreatedBy = request.CreatedBy,
            UpdatedBy = request.UpdatedBy,
            CreatedOn = DateTimeOffset.UtcNow,
            UpdatedOn = DateTimeOffset.UtcNow,
        };

        user.Password = _passwordHasher.HashPassword(user, "Welcome@123");

        _dbContext.UserMasters.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapUserResponse(user);
    }

    public async Task<UserResponseDto> UpdateUserAsync(int id,UserUpsertDto request,CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.UserMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"User with id {id} does not exist.");

        await ValidateUserReferencesAsync(request, id, cancellationToken);

        user.FullName = request.FullName;
        user.EmailId = request.EmailId;
        user.ManagerId = request.ManagerId;
        user.CompanyId = request.CompanyId;
        user.RoleId = request.RoleId;
        user.JoiningDate = request.JoiningDate;
        user.ProbationMonths = request.ProbationMonths;
        user.ConfirmationDate = request.ConfirmationDate;
        user.StatusCode = request.StatusCode;
        user.UpdatedBy = request.UpdatedBy;
        user.UpdatedOn = DateTimeOffset.UtcNow;
        

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapUserResponse(user);
    }

    public async Task DeleteUserAsync(int id,int updatedBy,CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.UserMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"User with id {id} does not exist.");

        user.StatusCode = 0;
        user.UpdatedBy = updatedBy;
        user.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CompanyUserListItemDto>> GetCompanyUsersAsync(int companyId,CancellationToken cancellationToken = default)
    {
        return await (
            from user in _dbContext.UserMasters.AsNoTracking()
            where user.CompanyId == companyId
            join reportingManager in _dbContext.UserMasters.AsNoTracking()
                on user.ManagerId equals reportingManager.Id into reportingManagers
            from reportingManager in reportingManagers.DefaultIfEmpty()
            orderby user.FullName
            select new CompanyUserListItemDto
            {
            Id = user.Id,
            FullName = user.FullName,
            EmailId = user.EmailId,
            RoleId = user.RoleId,
            ManagerId = user.ManagerId,
            ReportingManagerEmailId =
            reportingManager == null ? null : reportingManager.EmailId,
            JoiningDate = user.JoiningDate,
            ProbationMonths = user.ProbationMonths,
            ConfirmationDate = user.ConfirmationDate,
            StatusCode = user.StatusCode
})
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ManagerListItemDto>> GetManagerListAsync(int companyId,CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserMasters
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.StatusCode == 1)
            .OrderBy(x => x.FullName)
            .Select(x => new ManagerListItemDto
            {
                Id = x.Id,
                FullName = x.FullName,
            })
            .ToListAsync(cancellationToken);
    }

    private async Task ValidateUserReferencesAsync(UserUpsertDto request,int? currentUserId,CancellationToken cancellationToken)
    {
        var companyExists = await _dbContext.CompanyMasters.AnyAsync(x => x.Id == request.CompanyId, cancellationToken);
        if (!companyExists)
        {
            throw new InvalidOperationException($"Company with id {request.CompanyId} does not exist.");
        }

        var roleExists = await _dbContext.RoleMasters.AnyAsync(x => x.Id == request.RoleId, cancellationToken);
        if (!roleExists)
        {
            throw new InvalidOperationException($"Role with id {request.RoleId} does not exist.");
        }

        if (request.ManagerId.HasValue)
        {
            if (currentUserId.HasValue && request.ManagerId.Value == currentUserId.Value)
            {
                throw new InvalidOperationException("A user cannot be their own reporting manager.");
            }

            var managerExists = await _dbContext.UserMasters.AnyAsync(
                x => x.Id == request.ManagerId.Value && x.StatusCode == 1,
                cancellationToken);
            if (!managerExists)
            {
                throw new InvalidOperationException($"Manager with id {request.ManagerId.Value} does not exist.");
            }
        }

        var emailTaken = await _dbContext.UserMasters.AnyAsync(
            x => x.EmailId == request.EmailId && (!currentUserId.HasValue || x.Id != currentUserId.Value),
            cancellationToken);
        if (emailTaken)
        {
            throw new InvalidOperationException($"A user with email {request.EmailId} already exists.");
        }
    }

    private static UserResponseDto MapUserResponse(UserMaster user)
    {
        return new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            EmailId = user.EmailId,
            CompanyId = user.CompanyId,
            RoleId = user.RoleId,
            ManagerId = user.ManagerId,
            JoiningDate = user.JoiningDate,
            ProbationMonths = user.ProbationMonths,
            ConfirmationDate = user.ConfirmationDate,
            StatusCode = user.StatusCode,
            CreatedOn = user.CreatedOn,
            UpdatedOn = user.UpdatedOn,
        };
    }

    public async Task UpdateUserStatusAsync(int id,int statusCode,CancellationToken cancellationToken = default)
            {
                var user = await _dbContext.UserMasters
                    .FirstOrDefaultAsync(
                        x => x.Id == id,
                        cancellationToken)
                    ?? throw new KeyNotFoundException(
                        $"User with id {id} does not exist.");

                user.StatusCode = (short)statusCode;

                user.UpdatedOn = DateTimeOffset.UtcNow;

                await _dbContext.SaveChangesAsync(
                    cancellationToken);
            }
}
