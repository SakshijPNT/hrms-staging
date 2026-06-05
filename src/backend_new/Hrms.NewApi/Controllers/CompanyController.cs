using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompanyController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly ICompanyManager _companyManager;
    private readonly IHolidayManager _holidayManager;

    public CompanyController(
        ICompanyManager companyManager,
        IHolidayManager holidayManager)
    {
        _companyManager = companyManager;
        _holidayManager = holidayManager;
    }

    [HttpPost("CreateCompany")]
    public async Task<IActionResult> CreateCompany(
        [FromBody] CompanyCreateDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var company = await _companyManager.CreateCompanyAsync(
                request,
                session.UserId,
                cancellationToken);

            if (request.Holidays.Count > 0)
            {
                await _holidayManager.BulkCreateHolidaysAsync(
                    new HolidayBulkCreateDto
                    {
                        CompanyId = company.Id,
                        Holidays = request.Holidays,
                    },
                    session.UserId,
                    cancellationToken);
            }

            return CreatedAtAction(nameof(GetCompanies), new { id = company.Id }, company);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("GetCompanies")]
    public async Task<IActionResult> GetCompanies(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var companies = await _companyManager.GetCompaniesAsync(
            session.CompanyId,
            session.RoleId,
            cancellationToken);

        return Ok(companies);
    }

    private SessionInfoDto? GetSessionInfo()
    {
        var rawSession = HttpContext.Session.GetString(SessionKey);
        return rawSession is null ? null : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }


   [HttpDelete("{companyId}")]
public async Task<IActionResult> DeleteCompany(int companyId,CancellationToken cancellationToken)
            {
                try
                {
                    // Example:
                    // Get logged-in user id from session/token
                    int deletedBy = 1;

                    var result = await _companyManager.DeleteCompanyAsync(
                        companyId,
                        deletedBy,
                        cancellationToken);

                    return Ok(new{message = "Company deleted successfully.",
                        success = result
                    });
                }
                catch (KeyNotFoundException ex)
                {
                    return NotFound(new
                    {
                        message = ex.Message
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        message = ex.Message
                    });
                }
            }


[HttpPut]
public async Task<IActionResult> UpdateCompany([FromBody] CompanyUpdateDto request,CancellationToken cancellationToken)
{
    try
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new
            {
                message = "No active session."
            });
        }

        var result =
            await _companyManager.UpdateCompanyAsync(request,session.UserId,cancellationToken);

        return Ok(new{
            message = "Company updated successfully.",
            data = result
        });
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(new
        {
            message = ex.Message
        });
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}

    [HttpPut("status")]
public async Task<IActionResult> UpdateCompanyStatus([FromBody] CompanyStatusUpdateDto request,CancellationToken cancellationToken)
{
    try
    {
        var session = GetSessionInfo();
        if (session is null)
            {
                return Unauthorized(new
            {
                message = "No active session."
            });
            }

        var result =await _companyManager.UpdateCompanyStatusAsync(request,session.UserId,cancellationToken);

        return Ok(new
        {
            message =
                "Company status updated successfully.",success = result
        });
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(new
        {
            message = ex.Message
        });
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}
}
