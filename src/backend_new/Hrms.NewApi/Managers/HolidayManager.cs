using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class HolidayManager : IHolidayManager
{
    private readonly HrmsDbContext _dbContext;

    public HolidayManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<HolidayResponseDto>> GetHolidaysAsync(
        int companyId,
        int? year,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.HolidayLists
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.StatusCode == 1);

        if (year.HasValue)
        {
            var start = new DateOnly(year.Value, 1, 1);
            var end = new DateOnly(year.Value, 12, 31);
            query = query.Where(x => x.HolidayDate >= start && x.HolidayDate <= end);
        }

        return await query
            .OrderBy(x => x.HolidayDate)
            .Select(x => MapHoliday(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<HolidayResponseDto> CreateHolidayAsync(
        HolidayCreateDto request,
        int createdBy,
        CancellationToken cancellationToken = default)
    {
        await EnsureCompanyExistsAsync(request.CompanyId, cancellationToken);

        var duplicate = await _dbContext.HolidayLists.AnyAsync(
            x => x.CompanyId == request.CompanyId
                && x.HolidayDate == request.HolidayDate
                && x.StatusCode == 1,
            cancellationToken);

        if (duplicate)
        {
            throw new InvalidOperationException(
                $"A holiday already exists on {request.HolidayDate:yyyy-MM-dd} for this company.");
        }

        var now = DateTimeOffset.UtcNow;
        var holiday = new HolidayList
        {
            CompanyId = request.CompanyId,
            HolidayDate = request.HolidayDate,
            HolidayName = request.HolidayName.Trim(),
            Description = request.Description,
            StatusCode = 1,
            CreatedBy = createdBy,
            UpdatedBy = createdBy,
            CreatedOn = now,
            UpdatedOn = now,
        };

        _dbContext.HolidayLists.Add(holiday);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapHoliday(holiday);
    }

    public async Task<IReadOnlyList<HolidayResponseDto>> BulkCreateHolidaysAsync(
        HolidayBulkCreateDto request,
        int createdBy,
        CancellationToken cancellationToken = default)
    {
        await EnsureCompanyExistsAsync(request.CompanyId, cancellationToken);

        if (request.Holidays.Count == 0)
        {
            return Array.Empty<HolidayResponseDto>();
        }

        var results = new List<HolidayResponseDto>();
        foreach (var item in request.Holidays)
        {
            try
            {
                var created = await CreateHolidayAsync(
                    new HolidayCreateDto
                    {
                        CompanyId = request.CompanyId,
                        HolidayDate = item.HolidayDate,
                        HolidayName = item.HolidayName,
                        Description = item.Description,
                    },
                    createdBy,
                    cancellationToken);

                results.Add(created);
            }
            catch (InvalidOperationException)
            {
                // Skip duplicate dates in bulk insert
            }
        }

        return results;
    }

    public async Task<HolidayResponseDto> UpdateHolidayAsync(
        HolidayUpdateDto request,
        int updatedBy,
        CancellationToken cancellationToken = default)
    {
        var holiday = await _dbContext.HolidayLists
            .FirstOrDefaultAsync(
                x => x.Id == request.Id && x.StatusCode == 1,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Holiday {request.Id} was not found.");

        EnsureNotPastHoliday(holiday.HolidayDate);

        holiday.HolidayName = request.HolidayName.Trim();
        holiday.Description = request.Description;
        holiday.UpdatedBy = updatedBy;
        holiday.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapHoliday(holiday);
    }

    public async Task DeleteHolidayAsync(
        int id,
        int companyId,
        CancellationToken cancellationToken = default)
    {
        var holiday = await _dbContext.HolidayLists
            .FirstOrDefaultAsync(
                x => x.Id == id
                    && x.CompanyId == companyId
                    && x.StatusCode == 1,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Holiday {id} was not found.");

        EnsureNotPastHoliday(holiday.HolidayDate);

        holiday.StatusCode = 0;
        holiday.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SyncHolidaysAsync(
        int companyId,
        int year,
        IReadOnlyList<HolidaySyncItemDto> holidays,
        int userId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCompanyExistsAsync(companyId, cancellationToken);

        var yearStart = new DateOnly(year, 1, 1);
        var yearEnd = new DateOnly(year, 12, 31);

        var normalized = holidays
            .Where(x =>
                !string.IsNullOrWhiteSpace(x.HolidayName)
                && x.HolidayDate >= yearStart
                && x.HolidayDate <= yearEnd)
            .ToList();

        var duplicateDates = normalized
            .GroupBy(x => x.HolidayDate)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateDates.Count > 0)
        {
            throw new InvalidOperationException(
                "Duplicate holiday dates are not allowed for the same company and year.");
        }

        var existing = await _dbContext.HolidayLists
            .Where(x =>
                x.CompanyId == companyId
                && x.StatusCode == 1
                && x.HolidayDate >= yearStart
                && x.HolidayDate <= yearEnd)
            .ToListAsync(cancellationToken);

        var incomingIds = normalized
            .Where(x => x.Id is > 0)
            .Select(x => x.Id!.Value)
            .ToHashSet();

        var now = DateTimeOffset.UtcNow;

        foreach (var holiday in existing.Where(x => !incomingIds.Contains(x.Id)))
        {
            if (IsPastHoliday(holiday.HolidayDate))
            {
                continue;
            }

            holiday.StatusCode = 0;
            holiday.UpdatedBy = userId;
            holiday.UpdatedOn = now;
        }

        foreach (var item in normalized.Where(x => x.Id is > 0))
        {
            var holiday = existing.FirstOrDefault(x => x.Id == item.Id)
                ?? throw new InvalidOperationException(
                    $"Holiday with id {item.Id} was not found for this company and year.");

            holiday.HolidayName = item.HolidayName.Trim();
            holiday.Description = string.IsNullOrWhiteSpace(item.Description)
                ? null
                : item.Description.Trim();
            holiday.UpdatedBy = userId;
            holiday.UpdatedOn = now;
        }

        foreach (var item in normalized.Where(x => x.Id is null or <= 0))
        {
            var inactive = await _dbContext.HolidayLists.FirstOrDefaultAsync(
                x => x.CompanyId == companyId
                    && x.HolidayDate == item.HolidayDate
                    && x.StatusCode == 0,
                cancellationToken);

            if (inactive is not null)
            {
                inactive.StatusCode = 1;
                inactive.HolidayName = item.HolidayName.Trim();
                inactive.Description = string.IsNullOrWhiteSpace(item.Description)
                    ? null
                    : item.Description.Trim();
                inactive.UpdatedBy = userId;
                inactive.UpdatedOn = now;
                continue;
            }

            var duplicate = existing.Any(x => x.HolidayDate == item.HolidayDate && x.StatusCode == 1)
                || await _dbContext.HolidayLists.AnyAsync(
                    x => x.CompanyId == companyId
                        && x.HolidayDate == item.HolidayDate
                        && x.StatusCode == 1,
                    cancellationToken);

            if (duplicate)
            {
                throw new InvalidOperationException(
                    $"A holiday already exists on {item.HolidayDate:yyyy-MM-dd} for this company.");
            }

            _dbContext.HolidayLists.Add(new HolidayList
            {
                CompanyId = companyId,
                HolidayDate = item.HolidayDate,
                HolidayName = item.HolidayName.Trim(),
                Description = string.IsNullOrWhiteSpace(item.Description)
                    ? null
                    : item.Description.Trim(),
                StatusCode = 1,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedOn = now,
                UpdatedOn = now,
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
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

    private static bool IsPastHoliday(DateOnly holidayDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return holidayDate < today;
    }

    private static void EnsureNotPastHoliday(DateOnly holidayDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (holidayDate < today)
        {
            throw new InvalidOperationException(
                "Past holidays cannot be edited or deleted.");
        }
    }

    private static HolidayResponseDto MapHoliday(HolidayList holiday)
    {
        return new HolidayResponseDto
        {
            Id = holiday.Id,
            CompanyId = holiday.CompanyId,
            HolidayDate = holiday.HolidayDate,
            HolidayName = holiday.HolidayName,
            Description = holiday.Description,
        };
    }
}
