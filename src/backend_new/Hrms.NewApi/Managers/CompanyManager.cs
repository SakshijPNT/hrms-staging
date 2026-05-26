using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class CompanyManager : ICompanyManager
{
    private const string ViewAllCompaniesActivityCode = "A0";

    private readonly HrmsDbContext _dbContext;

    public CompanyManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private async Task<bool> HasActivityAccessAsync(int userId,string activityCode,CancellationToken cancellationToken)
    {
        return await (
            from user in _dbContext.UserMasters
            join roleActivity in _dbContext.ActivityRoleMappings
                on user.RoleId equals roleActivity.RoleId
            join activity in _dbContext.ActivityMasters
                on roleActivity.ActivityId equals activity.Id
            where user.Id == userId
                  && user.StatusCode == 1
                  && roleActivity.StatusCode == 1
                  && activity.StatusCode == 1
                  && activity.ActivityCode == activityCode
            select activity.Id
        ).AnyAsync(cancellationToken);
    }

    public async Task<CompanyResponseDto> CreateCompanyAsync(CompanyCreateDto request,int createdBy,CancellationToken cancellationToken = default)
    {
        var hasAccess = await HasActivityAccessAsync(createdBy,ViewAllCompaniesActivityCode,cancellationToken);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to create company.");
        }

        var companyCodeTaken = await _dbContext.CompanyMasters
            .AnyAsync(
                x => x.CompanyCode == request.CompanyCode,
                cancellationToken);

        if (companyCodeTaken)
        {
            throw new InvalidOperationException(
                $"Company with code {request.CompanyCode} already exists.");
        }

        var now = DateTimeOffset.UtcNow;

        var company = new CompanyMaster
        {
            CompanyName = request.CompanyName,
            CompanyCode = request.CompanyCode,
            CompanyPhone = request.CompanyPhone,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            Pincode = request.Pincode,
            Timezone = request.Timezone,
            StatusCode = request.StatusCode,
            CreatedBy = createdBy,
            CreatedOn = now,
            UpdatedBy = createdBy,
            UpdatedOn = now,
        };

        _dbContext.CompanyMasters.Add(company);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapCompanyResponse(company);
    }




    public async Task<IReadOnlyList<CompanyListItemDto>> GetCompaniesAsync(int loggedInUserCompanyId,int loggedInUserRoleId,CancellationToken cancellationToken = default)
    {
        var canViewAllCompanies = await (
            from activityRoleMapping in _dbContext.ActivityRoleMappings
            join activity in _dbContext.ActivityMasters
                on activityRoleMapping.ActivityId equals activity.Id
            where activityRoleMapping.RoleId == loggedInUserRoleId
                && activityRoleMapping.StatusCode == 1
                && activity.StatusCode == 1
                && activity.ActivityCode == ViewAllCompaniesActivityCode
            select activity.Id
        ).AnyAsync(cancellationToken);

        var query = _dbContext.CompanyMasters.AsNoTracking();

        if (!canViewAllCompanies)
        {
            query = query.Where(x => x.Id == loggedInUserCompanyId);
        }

        return await query
            .OrderBy(x => x.CompanyName)
            .Select(x => new CompanyListItemDto
            {
                Id = x.Id,
                CompanyName = x.CompanyName,
                CompanyCode = x.CompanyCode,
                CompanyPhone = x.CompanyPhone,
                Address = x.Address,
                City = x.City,
                State = x.State,
                Country = x.Country,
                Pincode = x.Pincode,
                Timezone = x.Timezone,
                StatusCode = x.StatusCode,
            })
            .ToListAsync(cancellationToken);
    }

    private static CompanyResponseDto MapCompanyResponse(CompanyMaster company)
    {
        return new CompanyResponseDto
        {
            Id = company.Id,
            CompanyName = company.CompanyName,
            CompanyCode = company.CompanyCode,
            CompanyPhone = company.CompanyPhone,
            Address = company.Address,
            City = company.City,
            State = company.State,
            Country = company.Country,
            Pincode = company.Pincode,
            Timezone = company.Timezone,
            StatusCode = company.StatusCode,
            CreatedOn = company.CreatedOn,
            UpdatedOn = company.UpdatedOn,
        };
    }

    public async Task<bool> DeleteCompanyAsync(int companyId,int deletedBy,CancellationToken cancellationToken = default)
                {
                    var company = await _dbContext.CompanyMasters.FirstOrDefaultAsync(
                            x => x.Id == companyId,
                            cancellationToken);

                    if (company == null)
                    {
                        throw new KeyNotFoundException("Company not found.");
                    }

                    // Soft Delete
                    company.StatusCode = 0;

                    company.UpdatedBy = deletedBy;
                    company.UpdatedOn = DateTimeOffset.UtcNow;

                    await _dbContext.SaveChangesAsync(cancellationToken);

                    return true;
                }

    public async Task<CompanyResponseDto> UpdateCompanyAsync(CompanyUpdateDto request,int updatedBy,CancellationToken cancellationToken = default)
{
    var hasAccess = await HasActivityAccessAsync(
        updatedBy,
        ViewAllCompaniesActivityCode,
        cancellationToken);

    if (!hasAccess)
    {
        throw new UnauthorizedAccessException("You do not have permission to edit company.");
    }

    var company = await _dbContext.CompanyMasters
        .FirstOrDefaultAsync(
            x => x.Id == request.Id,
            cancellationToken);

    if (company == null)
    {
        throw new KeyNotFoundException(
            "Company not found.");
    }

    var duplicateCodeExists = await _dbContext.CompanyMasters
        .AnyAsync(
            x => x.CompanyCode == request.CompanyCode
                 && x.Id != request.Id,
            cancellationToken);

    if (duplicateCodeExists)
    {
        throw new InvalidOperationException(
            $"Company code {request.CompanyCode} already exists.");
    }

    company.CompanyName = request.CompanyName;
    company.CompanyCode = request.CompanyCode;
    company.CompanyPhone = request.CompanyPhone;
    company.Address = request.Address;
    company.City = request.City;
    company.State = request.State;
    company.Country = request.Country;
    company.Pincode = request.Pincode;
    company.Timezone = request.Timezone;
    company.StatusCode = (short)request.StatusCode;

    company.UpdatedBy = updatedBy;
    company.UpdatedOn = DateTimeOffset.UtcNow;

    await _dbContext.SaveChangesAsync(cancellationToken);

    return MapCompanyResponse(company);
}


   public async Task<bool> UpdateCompanyStatusAsync(CompanyStatusUpdateDto request,int updatedBy,CancellationToken cancellationToken = default)
{
    var hasAccess = await HasActivityAccessAsync(
        updatedBy,
        ViewAllCompaniesActivityCode,
        cancellationToken);

    if (!hasAccess)
    {
        throw new UnauthorizedAccessException(
            "You do not have permission to update company status.");
    }

    var company = await _dbContext.CompanyMasters
        .FirstOrDefaultAsync(
            x => x.Id == request.Id,
            cancellationToken);

    if (company == null)
    {
        throw new KeyNotFoundException(
            "Company not found.");
    }

    company.StatusCode = request.StatusCode;

    company.UpdatedBy = updatedBy;

    company.UpdatedOn = DateTimeOffset.UtcNow;

    await _dbContext.SaveChangesAsync(cancellationToken);

    return true;
}       



}
