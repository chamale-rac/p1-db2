import React, { useState, useEffect } from 'react'
import { Collapse, Chat, SearchInput, UserList } from '@components/global'
import { authStore } from '@context'
import { useNavigate } from 'react-router-dom'
import { useApi } from '@hooks'
import SkeletonElement from '@components/skeletons/SkeletonElement'
import Shimmer from '@components/skeletons/Shimmer'

import * as styles from './UsersPage.module.css'
import { Dropdown } from '../../components/global'

const UsersPage = () => {
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
  const [searchType, setSearchType] = useState('Reccomended')

  const navigate = useNavigate()

  const handleSetViewProfile = (user_id) => {
    navigate(`/home/users/${user_id}`)
  }

  const getAllUsers = async () => {
    console.log('search', search)
    if (search === '') {
      setSearchType('Recommended')
    } else {
      setSearchType('Search')
    }
    try {
      setLoading(true)
      const response = await handleRequest(
        'GET',
        `/users?search=${search}&user_id=${auth.user.id}&offset=${offset}&limit=${limit}`,
        {},
        {
          Authorization: 'Bearer ' + auth.authToken,
        },
        true,
      )
      /* console.log(response.data)*/

      setAllUsers(response.data.users)
      setAllPreLoadedUsers(response.data.users)
      setTotalResults(response.data.total)
    } catch (error) {
      console.error(error)
      setError(
        'Error fetching event details, please try again later or contact support',
      )
    } finally {
      setLoading(false)
    }
  }

  // useEffect(() => {
  //   if (search === '') {
  //     setAllUsers(allPreLoadedUsers)
  //   } else {
  //     const usersFiltered = allUsers.filter((user) => {
  //       return user.username.toLowerCase().includes(search.toLowerCase())
  //     })
  //     setAllUsers(usersFiltered)
  //   }
  // }, [search])

  useEffect(() => {
    getAllUsers()
  }, [])

  return (
    <div className={styles.container}>
      <h2 className={`${styles.title} font-bebas-neue`}>Find new friends</h2>
      <div className={styles.content_container}>
        <div className={styles.search_container}>
          <div className="mt-4">
            <SearchInput
              name={'search'}
              value={search}
              onChange={setSearch}
              onClick={getAllUsers}
              placeholder={'Search...'}
              isDynamic={true}
              searchIcon={'🔍'}
            />
          </div>
          {/** Select of limit */}
          <Dropdown
            label={'Users per page'}
            customStyles="p-4 mt-0"
            options={[10, 20, 30, 50]}
            selected={limit}
            setSelected={setLimit}
          />
        </div>

        {allUsers && !loading ? (
          <>
            <div className="border m-2 p-2 mt-4 shadow-md flex flex-row justify-between items-center">
              {/**
                add button to get previous users, if possible, and other button to get next users if possible
                */}

              <button
                className="button asap p-2 rounded-md"
                onClick={() => {
                  if (offset - limit >= 0) {
                    setOffset(offset - limit)
                    getAllUsers()
                  }
                }}
                disabled={offset <= 0}
                // Cursor disabled
                style={
                  offset <= 0
                    ? { cursor: 'not-allowed' }
                    : { cursor: 'pointer' }
                }
              >
                Previous {limit}
              </button>
              <div>
                <p className="text-lg font-bold">
                  {searchType} users! 😉 (Showing {offset + 1}-
                  {offset + Math.min(limit, totalResults)} of {totalResults}{' '}
                  results)
                </p>
              </div>

              <button
                className="button asap p-2 rounded-md"
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
            <UserList users={allUsers} onClickFunction={handleSetViewProfile} />
          </>
        ) : (
          <aside className={styles.skeleton_event_body}>
            <ul className={`${styles.skeleton_users_container}`}>
              {Array(10)
                .fill()
                .map((_, index) => (
                  <SkeletonElement key={index} type="friendPreview" />
                ))}
            </ul>
            <Shimmer />
          </aside>
        )}
      </div>
    </div>
  )
}

export default UsersPage
