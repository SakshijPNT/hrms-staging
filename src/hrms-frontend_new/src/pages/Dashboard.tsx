import { useEffect, useState } from 'react'
import Layout from './Layout'
import '../styles/Style.css'
import api from '../services/api'
import type { AxiosError } from 'axios'

export default function Dashboard() {

  interface Attendance {
  checkInTime: string | null
  checkOutTime: string | null
  workedHours: number
  attendanceStatus: string
}

  const [attendance, setAttendance] = useState<Attendance | null>(null)

  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [loading, setLoading] =
    useState(false)
 
    const session = JSON.parse(
  localStorage.getItem('session') || '{}'
)

const timezone =session.timezone || 'Asia/Kolkata'

  // =========================================
  // FETCH TODAY ATTENDANCE
  // =========================================

  /*const fetchTodayAttendance = async () => {

    try {

      const response =
        await api.get('/attendance/today')

      setAttendance(response.data)

    } catch {

      console.log(
        'No attendance found for today'
      )

      setAttendance(null)
    }
  }*/

  // =========================================
  // PAGE LOAD
  // =========================================

useEffect(() => {

   const loadAttendance = async () => {

    try {

    const response =
    await api.get('/attendance/today')

    setAttendance(response.data)
    } catch {
      console.log(
        'No attendance found for today'
      )
      setAttendance(null)
    }
  }

  loadAttendance()

  const timer = setInterval(() => {setCurrentTime(new Date())}, 1000)

  return () => clearInterval(timer)

}, [])

  // =========================================
  // CHECK IN
  // =========================================

  const handleCheckIn = async () => {

    try {

      setLoading(true)

      const response =
        await api.post('/attendance/check-in')

      setAttendance(response.data)

      alert('Checked in successfully')

    } catch (error: unknown) {

       const axiosError =
      error as AxiosError<{ message?: string }>

    alert(
      axiosError.response?.data?.message ||
      'Check-in failed'
    )

    } finally {

      setLoading(false)
    }
  }

  // =========================================
  // CHECK OUT
  // =========================================

  const handleCheckOut = async () => {

    try {

      setLoading(true)

      const response =
        await api.post('/attendance/check-out')

      setAttendance(response.data)

      alert('Checked out successfully')

    } catch (error: unknown) {

       const axiosError =
      error as AxiosError<{ message?: string }>

      alert(
        axiosError.response?.data?.message ||
      'Check-out failed'
      )

    } finally {

      setLoading(false)
    }
  }

  // =========================================
  // FORMAT TIME
  // =========================================

  const formatTime = (time: string | null | undefined) => {

    if (!time) return '--:--'

    return new Date(time).toLocaleTimeString(
      'en-US',
      {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      }
    )
  }

  return (

    <Layout title="Dashboard">

      <div className="attendance-card">

        {/* LEFT SIDE */}

        <div className="attendance-left">

          <p className="attendance-date">

            {currentTime.toLocaleDateString(
              'en-US',
              {
                timeZone: timezone,
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }
            )}

          </p>

          <h1 className="attendance-time">

            {currentTime.toLocaleTimeString(
            'en-US',
            {
              timeZone: timezone,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              }
            )}

          </h1>

          <p className="attendance-location">
            {timezone}
          </p>

        </div>

        {/* CENTER */}

        <div className="attendance-center">

          <div className="attendance-info">

            <span>IN</span>

            <strong>
              {formatTime(attendance?.checkInTime)}
            </strong>

          </div>

          <div className="attendance-info">

            <span>OUT</span>

            <strong>
              {formatTime(attendance?.checkOutTime)}
            </strong>

          </div>

          <div className="attendance-info">

            <span>HOURS</span>

            <strong>

              {
                attendance
                  ? `${attendance.workedHours}h`
                  : '0h'
              }

            </strong>

          </div>

          <div className="attendance-info">

            <span>STATUS</span>

            <strong>

              {
                attendance?.attendanceStatus ||
                'NOT CHECKED IN'
              }

            </strong>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="attendance-buttons">

          {/* CHECK IN */}

          <button
            className={`check-btn check-in-btn ${
              attendance?.checkInTime
                ? 'active-btn'
                : ''
            }`}
            onClick={handleCheckIn}
            disabled={
              !!attendance?.checkInTime || loading
            }
          >

            {
              attendance?.checkInTime
                ? 'CHECKED IN'
                : 'CHECK IN'
            }

          </button>

          {/* CHECK OUT */}

          <button
            className="check-btn check-out-btn"
            onClick={handleCheckOut}
            disabled={
              !attendance?.checkInTime || loading
            }
          >

            CHECK OUT

          </button>

        </div>

      </div>

    </Layout>
  )
}