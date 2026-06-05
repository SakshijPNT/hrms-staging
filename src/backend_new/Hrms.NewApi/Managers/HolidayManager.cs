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
