import React, { useState, useEffect } from 'react'
import {
  Collapse,
  Chat,
  SearchInput,
  UserList,
  Input,
} from '@components/global'

import { Events } from '@features/render'
import { authStore } from '@context'
import { useNavigate } from 'react-router-dom'
import { useApi } from '@hooks'
import SkeletonEventPreview from './SkeletonEventPreview/SkeletonEventPreview'
import Shimmer from '@components/skeletons/Shimmer'

import * as styles from './GlobalEvents.module.css'
import { Dropdown } from '../../../components/global'
const UsersPage = () => {
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [userEvents, setUserEvents] = useState([])
  const { handleRequest } = useApi()
  const { auth } = authStore
  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState(null)
  const [allPreLoadedUsers, setAllPreLoadedUsers] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(30)
  const [totalResults, setTotalResults] = useState(0)
  const [searchType, setSearchType] = useState('Searching in')
  const [suggestBy, setSuggestBy] = useState('Friends')
  const [tags, setTags] = useState('')
  const [durationSort, setDurationSort] = useState('asc')
  const [dateSort, setDateSort] = useState('asc')
  const [joinable, setJoinable] = useState('Yes')
  const [suggestions, setSuggestions] = useState('No')

  const navigate = useNavigate()

  const handleSetViewProfile = (user_id) => {
    navigate(`/home/users/${user_id}`)
  }

  const getAllUsers = async () => {
    if (search !== '') {
      setSearchType('Searching')
    } else {
      setSearchType('')
    }
    try {
      setLoading(true)
      setUserEvents([])
      const joinableBool = joinable === 'Yes' ? true : false
      const suggestionsBool = suggestions === 'Yes' ? true : false

      console.log('joinableBool', joinableBool)
      console.log('suggestionsBool', suggestionsBool)
      const response = await handleRequest(
        'POST',
        `/events/search?search=${search}&user_id=${auth.user.id}&offset=${offset}&limit=${limit}`,
        {
          tags: formatTags(tags),
          startDate: startDate,
          endDate: endDate,
          dateSort: sortNameToNum(dateSort),
          durationSort: sortNameToNum(durationSort),
          joinable: joinableBool,
          suggestions: suggestionsBool,
        },
        {
          Authorization: 'Bearer ' + auth.authToken,
        },
        true,
      )
      /* console.log(response.data)*/

      // setAllUsers(response.data.users)
      // setAllPreLoadedUsers(response.data.users)
      console.log('response.data', response.data)
      setUserEvents(response.data.events)
      setTotalResults(response.data.totalResults)
    } catch (error) {
      console.error(error)
      setError(
        'Error fetching event details, please try again later or contact support',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getAllUsers()
  }, [])

  useEffect(() => {
    getAllUsers()
  }, [limit, offset])

  function formatTags(tags) {
    console.log('tags', tags)
    if (tags === '') {
      return []
    } else {
      return tags.split(',').map((tag) => tag.trim())
    }
  }

  function sortNameToNum(name) {
    if (name === 'asc') {
      return 1
    } else {
      return -1
    }
  }

  function setLimitInt(limit) {
    setLimit(parseInt(limit))
  }

  return (
    <div className={styles.container}>
      <div className={styles.flexContainer}>
        <h1>Events</h1>
      </div>

      <div className={`${styles.search} mb-4 flex-col items-center`}>
        <div className="flex flex-row items-center gap-4 mb-4">
          <SearchInput
            name={'search'}
            value={search}
            onChange={setSearch}
            onClick={getAllUsers}
            placeholder={'Title...'}
            isDynamic={true}
            searchIcon={'🔍'}
          />
        </div>
        <div className="flex flex-row items-center gap-5">
          <div>
            <SearchInput
              name={'tags'}
              value={tags}
              onChange={setTags}
              placeholder={'Tags'}
              isDynamic={false}
            />
            *Separate tags with commas
          </div>
          {/** Select of limit */}
          <div className={`${styles.dateFilter} font-space-grotesk`}>
            <Input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              name="date"
              label="Min Date"
              type="date"
              required
            />

            <Input
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              name="date"
              label="Max Date"
              type="date"
              required
            />
          </div>
          <Dropdown
            label={'Date sort'}
            customStyles=""
            options={['asc', 'desc']}
            selected={dateSort}
            setSelected={setDateSort}
          />
          <Dropdown
            label={'Duration sort'}
            customStyles=""
            options={['asc', 'desc']}
            selected={durationSort}
            setSelected={setDurationSort}
          />
          <Dropdown
            label={'Joinable:'}
            customStyles=""
            options={['Yes', 'No']}
            selected={joinable}
            setSelected={setJoinable}
          />
          <Dropdown
            label={'Suggestions:'}
            customStyles=""
            options={['Yes', 'No']}
            selected={suggestions}
            setSelected={setSuggestions}
          />
          <Dropdown
            label={'Events per page:'}
            customStyles=""
            options={[10, 20, 30, 50]}
            selected={limit}
            setSelected={setLimitInt}
          />
        </div>
      </div>

      <div className="flex flex-row items-center justify-between p-2 m-2 mt-4 border shadow-md">
        {/**
                add button to get previous users, if possible, and other button to get next users if possible
                */}

        <button
          className="p-2 rounded-md button asap"
          onClick={() => {
            if (offset - limit >= 0) {
              setOffset(offset - limit)
              getAllUsers()
            }
          }}
          disabled={offset <= 0}
          // Cursor disabled
          style={
            offset <= 0 ? { cursor: 'not-allowed' } : { cursor: 'pointer' }
          }
        >
          Previous {limit}
        </button>
        <div className="p-3 text-center">
          <p className="text-lg font-bold">
            {searchType} {suggestions === 'Yes' ? 'Suggested' : 'All'} events 😉
            (Showing {offset + 1}-{offset + Math.min(limit, totalResults)} of{' '}
            {totalResults} results)
          </p>
        </div>

        <button
          className="p-2 rounded-md button asap"
          onClick={() => {
            if (offset + limit < totalResults) {
              setOffset(offset + limit)
              getAllUsers()
            }
          }}
          disabled={offset + limit >= totalResults}
          // Cursor disabled
          style={
            offset + limit >= totalResults
              ? { cursor: 'not-allowed' }
              : { cursor: 'pointer' }
          }
        >
          Next {limit}
        </button>
      </div>

      {userEvents?.length > 0 ? (
        <>
          <div className={styles.eventsContainer}>
            <Events events={userEvents} />
          </div>
        </>
      ) : loading ? (
        <ul className={styles.skeletons_events_container}>
          <SkeletonEventPreview />
          <SkeletonEventPreview />
          <SkeletonEventPreview />
          <SkeletonEventPreview />
          <SkeletonEventPreview />
        </ul>
      ) : (
        <div className={`${styles.noEvents} font-bebas-neue`}>
          No events found! 😔
        </div>
      )}
    </div>
  )
}

export default UsersPage
