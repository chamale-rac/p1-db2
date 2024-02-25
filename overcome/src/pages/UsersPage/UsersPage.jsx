import React, { useState, useEffect } from 'react'
import { Collapse, Chat, SearchInput, UserList } from '@components/global'
import { authStore } from '@context'
import { useNavigate } from 'react-router-dom'
import { useApi } from '@hooks'
import SkeletonElement from '@components/skeletons/SkeletonElement'
import Shimmer from '@components/skeletons/Shimmer'

import * as styles from './UsersPage.module.css'

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

  const navigate = useNavigate()

  const handleSetViewProfile = (user_id) => {
    navigate(`/home/users/${user_id}`)
  }

  const getAllUsers = async () => {
    console.log('search', search)
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
      <h2 className={`${styles.title} font-bebas-neue`}>Search Users</h2>
      <div className={styles.content_container}>
        <div className={styles.search_container}>
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
        {allUsers && !loading ? (
          <UserList users={allUsers} onClickFunction={handleSetViewProfile} />
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
