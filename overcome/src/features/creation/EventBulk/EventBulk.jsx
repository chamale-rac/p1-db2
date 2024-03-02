import React, { useState } from 'react'

import { useApi } from '@hooks'
import { authStore } from '@context'
import * as styles from './EventBulk.module.css'
import { ClockLoader } from '@components/global'

const EventBulk = () => {
  const { auth } = authStore

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const { handleRequest } = useApi()

  const sendFile = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)
    console.log('file :>> ', file)
    const formData = new FormData()
    formData.append('file', file)
    for (let pair of formData.entries()) {
      console.log(pair[0] + ', ', pair[1])
    }
    try {
      const response = await handleRequest(
        'POST',
        `/bulk/massiveEventsCreation/${auth.user.id}`,
        formData,
        {
          Authorization: 'Bearer ' + auth.authToken,
        },
        true,
      )
      // Check the status
      if (response.status === 200) {
        setMessage(response.data.message)
      } else {
        setError(rresponse.data.message)
      }
    } catch (error) {
      setError('Error creating events')
    } finally {
      setFile(null)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full gap-2">
      <label
        htmlFor="json-upload"
        className={`flex flex-col items-center justify-center w-64 h-32 bg-[#ededed] border border-black rounded cursor-pointer hover:bg-[#cdd57e] border-dashed`}
      >
        <span className={`${styles.thisButton}`}>📄 Upload a file...</span>
        <p className="text-sm opacity-90 ">
          {file ? file.name : '⚠️ No file selected'}
        </p>
      </label>

      <input
        style={{ display: 'none' }}
        type="file"
        onChange={(e) => {
          console.log('uploaded file')
          console.log('e.target.files[0] :>> ', e.target.files[0])
          setFile(e.target.files[0])
        }}
        id="json-upload"
        name="json-upload"
        accept=".json"
        className="px-4 py-2 mt-2 text-base text-black transition duration-500 ease-in-out transform bg-blue-600 border-transparent rounded-lg focus:border-blue-500 focus:bg-blue-500 focus:outline-none focus:shadow-outline focus:ring-2 ring-offset-current ring-offset-2"
      />
      {file && (
        <button onClick={() => sendFile()} className="p-4 rounded button asap">
          Send file
        </button>
      )}
      {loading ? <ClockLoader fontSize="3" /> : null}
      {message ? <div className="mt-2 text-lg">{message} 🚀</div> : null}
      {error ? <div className="mt-2 text-lg">{error} ❌</div> : null}
    </div>
  )
}

export default EventBulk
