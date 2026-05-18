import { useEffect, useState } from 'react'
import Layout from './Layout'
import '../styles/Style.css'

export default function Dashboard() {

  const [checkedIn, setCheckedIn] = useState(false)
  const [checkedOut, setCheckedOut] = useState(false)

  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [checkInTime, setCheckInTime] =
    useState('')

  const [checkOutTime, setCheckOutTime] =
    useState('')

  const [workingHours, setWorkingHours] =
    useState('')

  useEffect(() => {

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)

  }, [])

  const handleCheckIn = () => {

    const now = new Date()

    setCheckedIn(true)
    setCheckedOut(false)

    setCheckInTime(
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    )
  }

  const handleCheckOut = () => {

    if (checkedIn) {

      const now = new Date()

      setCheckedOut(true)

      setCheckOutTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )

      const checkInDate = new Date()

      const [time, modifier] =
        checkInTime.split(' ')

      const [hours, minutes] =
        time.split(':')

      let hour = parseInt(hours)

      if (modifier === 'PM' && hour !== 12) {
        hour += 12
      }

      if (modifier === 'AM' && hour === 12) {
        hour = 0
      }

      checkInDate.setHours(hour)
      checkInDate.setMinutes(parseInt(minutes))
      checkInDate.setSeconds(0)

      const diffMs =
        now.getTime() - checkInDate.getTime()

      const totalMinutes =
        Math.floor(diffMs / (1000 * 60))

      const hrs = Math.floor(totalMinutes / 60)

      const mins = totalMinutes % 60

      setWorkingHours(`${hrs}h ${mins}m`)
    }
  }

  return (

    <Layout title="Dashboard">

      <div className="attendance-card">

        <div className="attendance-left">

          <p className="attendance-date">

            {currentTime.toLocaleDateString(
              'en-US',
              {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }
            )}

          </p>

          <h1 className="attendance-time">

            {currentTime.toLocaleTimeString()}

          </h1>

          <p className="attendance-location">
            Asia/Kolkata
          </p>

        </div>

        <div className="attendance-center">

          <div className="attendance-info">
            <span>IN</span>
            <strong>
              {checkInTime || '--:--'}
            </strong>
          </div>

          <div className="attendance-info">
            <span>OUT</span>
            <strong>
              {checkOutTime || '--:--'}
            </strong>
          </div>

          <div className="attendance-info">
            <span>HOURS</span>
            <strong>
              {workingHours || '0h 0m'}
            </strong>
          </div>

        </div>

        <div className="attendance-buttons">

          <button
            className={`check-btn check-in-btn ${
              checkedIn ? 'active-btn' : ''
            }`}
            onClick={handleCheckIn}
            disabled={checkedIn}
          >
            {checkedIn
              ? 'CHECKED IN'
              : 'CHECK IN'}
          </button>

          <button
            className={`check-btn check-out-btn ${
              checkedOut ? 'active-btn' : ''
            }`}
            onClick={handleCheckOut}
            disabled={!checkedIn || checkedOut}
          >
            {checkedOut
              ? 'CHECKED OUT'
              : 'CHECK OUT'}
          </button>

        </div>

      </div>

    </Layout>
  )
}