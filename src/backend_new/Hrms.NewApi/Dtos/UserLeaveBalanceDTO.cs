using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hrms.NewApi.Dtos
{
    public class UserLeaveBalanceDTO
    {
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; }
        public decimal AvailableBalance { get; set; }
    }
}