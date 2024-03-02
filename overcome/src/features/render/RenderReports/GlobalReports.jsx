import { useState, useEffect } from 'react'
import { useApi } from '@hooks'
import * as styles from './GlobalReports.module.css'
import Reports from '../Reports/Reports'
import { ClockLoader } from '@components/global'

function GlobalReports() {
  const [reports, setReports] = useState([])
  const { handleRequest } = useApi()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAllReports()
  }, [])

  const getAllReports = async () => {
    setLoading(true)
    try {
      const response = await handleRequest(
        'GET',
        '/reports?type=Event',
        {},
        {},
        false,
      )
      setReports(response.data?.data?.reports)
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.flexContainer} flex flex-col items-start`}>
        <h1>Help the community</h1>
        <h2>Solving one report at a time!</h2>
      </div>

      {reports.length > 0 ? (
        <div className={styles.eventsContainer}>
          <Reports reports={reports} handleSuccess={getAllReports} />
        </div>
      ) : loading ? (
        <div className={`${styles.noEvents} font-bebas-neue`}>
          Loading... <ClockLoader fontSize={'3.8'} />
        </div>
      ) : (
        <div className={`${styles.noEvents} font-bebas-neue`}>
          No reports found! 😔
        </div>
      )}
      <hr className="w-11/12 mx-auto my-8 bg-gray-200 border-t-2 border-gray-800 "></hr>
      <div className={`${styles.flexContainer} flex flex-col items-start`}>
        <h1>Massive events creation</h1>
        <h2>Admin privileges 🤓</h2>
      </div>
    </div>
  )
}

export default GlobalReports
