using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class LeaveTypeManager : ILeaveTypeManager
{
    private readonly HrmsDbContext _dbContext;

    public LeaveTypeManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<LeaveTypeResponseDto>> GetLeaveTypesAsync(
        int companyId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.LeaveTypeMasters
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.StatusCode == 1)
            .OrderBy(x => x.LeaveTypeName)
            .Select(x => MapLeaveType(x))
            .ToListAsync(cancellationToken);
    }

    public async Task SyncLeaveTypesAsync(
        int companyId,
        IReadOnlyList<LeaveTypeSyncItemDto> leaveTypes,
        int userId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCompanyExistsAsync(companyId, cancellationToken);

        var normalized = leaveTypes
            .Where(x => !string.IsNullOrWhiteSpace(x.LeaveTypeName))
            .Select(x =>
            {
                ValidateLeaveTypeItem(x);
                return x;
            })
            .ToList();

        var duplicateNames = normalized
            .GroupBy(x => x.LeaveTypeName.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateNames.Count > 0)
        {
            throw new InvalidOperationException(
                $"Duplicate leave type names are not allowed: {string.Join(", ", duplicateNames)}.");
        }

        var allRows = await _dbContext.LeaveTypeMasters
            .Where(x => x.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var matchedRowIds = new HashSet<int>();

        foreach (var item in normalized)
        {
            var row = ResolveLeaveTypeRow(item, allRows);

            if (row is not null)
            {
                matchedRowIds.Add(row.Id);
                ApplyLeaveTypeValues(row, item, userId, now, reactivate: true);
                continue;
            }

            var created = new LeaveTypeMaster
            {
                CompanyId = companyId,
                StatusCode = 1,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedOn = now,
                UpdatedOn = now,
            };

            ApplyLeaveTypeValues(created, item, userId, now, reactivate: true);
            _dbContext.LeaveTypeMasters.Add(created);
            allRows.Add(created);
        }

        foreach (var row in allRows.Where(x => x.StatusCode == 1 && !matchedRowIds.Contains(x.Id)))
        {
            var hasApplications = await _dbContext.LeaveApplications.AnyAsync(
                x => x.LeaveTypeId == row.Id && x.StatusCode == 1,
                cancellationToken);

            if (hasApplications)
            {
                throw new InvalidOperationException(
                    $"Leave type \"{row.LeaveTypeName}\" cannot be removed because leave applications exist.");
            }

            row.StatusCode = 0;
            row.UpdatedBy = userId;
            row.UpdatedOn = now;
        }

        var hasNewRows = _dbContext.ChangeTracker
            .Entries<LeaveTypeMaster>()
            .Any(entry => entry.State == EntityState.Added);

        if (hasNewRows)
        {
            await _dbContext.Database.ExecuteSqlRawAsync(
                """
                SELECT setval(
                    pg_get_serial_sequence('leavetypemaster', 'id'),
                    COALESCE((SELECT MAX(id) FROM leavetypemaster), 1)
                )
                """,
                cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static LeaveTypeMaster? ResolveLeaveTypeRow(
        LeaveTypeSyncItemDto item,
        IReadOnlyList<LeaveTypeMaster> allRows)
    {
        if (item.Id is > 0)
        {
            var byId = allRows.FirstOrDefault(x => x.Id == item.Id);
            if (byId is not null)
            {
                return byId;
            }
        }

        var name = item.LeaveTypeName.Trim();
        return allRows.FirstOrDefault(x =>
            string.Equals(x.LeaveTypeName, name, StringComparison.OrdinalIgnoreCase));
    }

    private static void ApplyLeaveTypeValues(
        LeaveTypeMaster row,
        LeaveTypeSyncItemDto item,
        int userId,
        DateTimeOffset now,
        bool reactivate)
    {
        row.LeaveTypeName = item.LeaveTypeName.Trim();
        row.Description = string.IsNullOrWhiteSpace(item.Description)
            ? null
            : item.Description.Trim();
        row.MaxDaysAllowed = item.MaxDaysAllowed;
        row.IsCarryForward = item.IsCarryForward;
        row.MaxCarryForward = item.IsCarryForward
            ? item.MaxCarryForward
            : null;
        row.UpdatedBy = userId;
        row.UpdatedOn = now;

        if (reactivate)
        {
            row.StatusCode = 1;
        }
    }

    private static void ValidateLeaveTypeItem(LeaveTypeSyncItemDto item)
    {
        if (item.MaxDaysAllowed <= 0)
        {
            throw new InvalidOperationException(
                $"Max days allowed must be greater than zero for \"{item.LeaveTypeName}\".");
        }

        if (item.IsCarryForward)
        {
            if (!item.MaxCarryForward.HasValue || item.MaxCarryForward <= 0)
            {
                throw new InvalidOperationException(
                    $"Max carry forward is required when carry forward is enabled for \"{item.LeaveTypeName}\".");
            }

            if (item.MaxCarryForward > item.MaxDaysAllowed)
            {
                throw new InvalidOperationException(
                    $"Max carry forward cannot exceed max days allowed for \"{item.LeaveTypeName}\".");
            }
        }
    }

    private async Task EnsureCompanyExistsAsync(
        int companyId,
        CancellationToken cancellationToken)
    {
        var exists = await _dbContext.CompanyMasters
            .AnyAsync(x => x.Id == companyId, cancellationToken);

        if (!exists)
        {
            throw new InvalidOperationException(
                $"Company with id {companyId} does not exist.");
        }
    }

    private static LeaveTypeResponseDto MapLeaveType(LeaveTypeMaster leaveType)
    {
        return new LeaveTypeResponseDto
        {
            Id = leaveType.Id,
            CompanyId = leaveType.CompanyId,
            LeaveTypeName = leaveType.LeaveTypeName,
            Description = leaveType.Description,
            MaxDaysAllowed = leaveType.MaxDaysAllowed,
            IsCarryForward = leaveType.IsCarryForward,
            MaxCarryForward = leaveType.MaxCarryForward,
        };
    }
}
