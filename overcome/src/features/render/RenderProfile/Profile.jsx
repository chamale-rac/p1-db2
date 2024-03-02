import { useEffect, useState } from 'react'
import { useApi } from '@hooks'
import { authStore } from '@context'
import { Events } from '@features/render'
import { ImageCustomizer } from '@features/creation'
import { ControlledPopup, ClockLoader } from '@components/global'
import * as styles from './Profile.module.css'
import { image } from '@context'
import EditProfile from '../../creation/EditProfile/EditProfile'
import { FriendRequests } from '@features/render'
import SkeletonElement from '@components/skeletons/SkeletonElement'
import Shimmer from '@components/skeletons/Shimmer'
import ProfileLoader from './ProfileLoader/ProfileLoader'

import { SERVER_BASE_URL } from '@utils/constants'

import { Toaster } from 'sonner'
function Profile() {
  const [error, setError] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [loading, setLoading] = useState(false)

  const { handleRequest } = useApi()
  const [user, setUser] = useState({})
  const [userid, setUserid] = useState({})
  const [users, setUsers] = useState([])

  const [openProfilePopup, setOpenProfilePopup] = useState(false)
  const [openInfoPopup, setOpenInfoPopup] = useState(false)
  const [openRequestPopup, setOpenRequestPopup] = useState(false)
  const [userImage, setUserImage] = useState(null)

  const closeProfilePopup = () => setOpenProfilePopup(false)
  const closeInfoPopup = () => setOpenInfoPopup(false)
  const closeRequestPopup = () => setOpenRequestPopup(false)

  const { auth } = authStore

  const editProfile = async (newImage) => {
    try {
      setLoading(true)

      console.log('newImage', newImage)
      const formData = new FormData()
      formData.append('image', newImage)

      const response = await handleRequest(
        'POST',
        `/images/upload/${auth.user.id}`,
        formData,
        {
          Authorization: 'Bearer ' + auth.authToken,
        },
        true,
      )
      console.log('upload response data', response.data)
      console.log('upload response', response)
      /* console.log(response.data)*/
      // add just a new field or update the profilePicture field
      setUser({ ...user })
      setUserImage(URL.createObjectURL(newImage))
      image.result = ''
    } catch (error) {
      console.error(error)
      setError(
        'Error fetching event details, please try again later or contact support',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSaveImage = (newImage) => {
    /* console.log('is saving')*/
    editProfile(newImage)
  }

  const getUsers = async () => {
    // const response = await handleRequest('GET', '/users/', {}, {}, true)
    const response = await handleRequest(
      'GET',
      '/users/',
      {},
      {
        Authorization: 'Bearer ' + auth.authToken,
      },
      true,
    )
    /* console.log('USERS!', response)*/
    setUsers(response.data)
  }

  const getUser = async () => {
    setProfileLoading(true)
    // const response = await handleRequest('GET', '/users/', {}, {}, true)
    /* console.log('testttt', auth.user.id)*/
    const response = await handleRequest(
      'GET',
      `/users/${auth.user.id}`,
      {},
      {
        Authorization: 'Bearer ' + auth.authToken,
      },
      true,
    )
    /* console.log('USER!!!', response)*/
    console.log('USER!!!', response.data)
    setUser(response.data)

    if (user.profilePicture) {
      // If not includes http or https, then it's a local image
      if (
        !user.profilePicture.includes('http') &&
        !user.profilePicture.includes('https')
      ) {
        console.log('local image')
        const imageUrl = await getImage(user.profilePicture)
        setUser(
          (prev) => ({
            ...prev,
            profilePicture: imageUrl,
          }),
          console,
        )
      }
    }

    setProfileLoading(false)
  }

  const getImage = async (imageId) => {
    if (imageId) {
      try {
        console.log('imageId', imageId)
        const response = await fetch(`
        ${SERVER_BASE_URL}/images/image/${imageId}
        `)
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)
        return imageUrl
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  useEffect(() => {
    /* console.log(auth)*/
    /* console.log(auth.user.username, auth.user.id)*/
    getUser()
    setUserid({
      username: auth.user.username,
      userid: auth.user.id,
    })
  }, [auth])

  // useEffect(() => {
  //   getUsers()
  // }, [])

  return (
    <div className={styles.container}>
      <Toaster position="bottom-right" />
      <ControlledPopup
        title={'👥 Friend Requests'}
        isOpen={openRequestPopup}
        closeFunction={closeRequestPopup}
      >
        <FriendRequests />
      </ControlledPopup>
      <ControlledPopup
        title={'🖼️ Profile Picture'}
        isOpen={openProfilePopup}
        closeFunction={closeProfilePopup}
      >
        {loading ? (
          <div className={styles.loading}>
            <ClockLoader fontSize="5" />
            <span>Updating profile picture...</span>
          </div>
        ) : (
          <ImageCustomizer
            actualImage={user.profilePicture ?? '/profile-400.png'}
            saveNewImage={handleSaveImage}
          />
        )}
      </ControlledPopup>
      <ControlledPopup
        title={'Profile Info'}
        isOpen={openInfoPopup}
        closeFunction={closeInfoPopup}
      >
        <EditProfile
          user={user}
          successAction={(values) => {
            setUser({
              ...user,
              ...values,
            })
            setOpenInfoPopup(false)
          }}
        />
      </ControlledPopup>
      <div className="flex flex-row justify-end w-full gap-2 text-xs md:text-sm">
        <button
          type="button"
          onClick={() => {
            setOpenRequestPopup((o) => !o)
          }}
          className="border py-1  md:p-2 rounded-xl border-black bg-black text-white hover:bg-[#cdd57e] hover:text-black transition-all"
        >
          Friend Requests
        </button>
        <button
          type="button"
          onClick={() => {
            setOpenInfoPopup((o) => !o)
          }}
          className="border py-1 md:p-2  border-dashed rounded-xl  border-black hover:bg-[#cdd57e] transition-all"
        >
          Edit Info
        </button>
        <button
          type="button"
          onClick={() => setOpenProfilePopup((o) => !o)}
          className="border py-1  md:p-2  border-dashed  rounded-xl border-black hover:bg-[#cdd57e] transition-all"
        >
          Edit Picture
        </button>
      </div>
      {!profileLoading ? (
        <>
          <div className="flex flex-col justify-start w-full mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4 ">
                <div className="relative object-cover w-20 h-20 md:h-24 md:w-24">
                  <img
                    src={user.profilePicture ?? '/profile-400.png'}
                    alt="Profile Image"
                    className="object-fill w-20 h-20 rounded-full shadow-2xl md:h-24 md:w-24"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-left text-light-1 md:text-5xl">
                    {`${user.name} ${user.lastname}`}
                  </h2>
                  <p className="text-base font-medium text-gray-500 md:text-xl ">
                    @{user.username}
                  </p>
                </div>
              </div>
            </div>
            <div className="max-w-lg mt-6 ml-2 text-xs text-light-2 xs:ml-0 md:text-base">
              <p className="text-left">
                <span className="font-bold">Interests:</span>{' '}
                {Array.isArray(user?.interests) && user?.interests.length > 0
                  ? user?.interests?.join(', ')
                  : 'No interests found'}
              </p>
              <p className="text-left">
                <span className="font-bold">Favorite Games:</span>{' '}
                {Array.isArray(user?.favorites) && user?.favorites.length > 0
                  ? user?.favorites.join(', ')
                  : 'No favorite games found'}
              </p>
            </div>
            <div className="mt-6 h-0.5 w-full bg-black" />
          </div>
          <section>
            <h2 className="mt-6 mb-1 text-4xl">Joined Hooks</h2>
            <div className="grid grid-cols-1 gap-3 divide-y md:gap-6 divide-zinc-200 md:grid-cols-4">
              {user?.joinedEvents && user?.joinedEvents.length > 0 ? (
                <Events events={user.joinedEvents} inProfile={true} />
              ) : (
                <div>No joined events found! 😔</div>
              )}
            </div>
            <h2 className="mt-6 mb-1 text-4xl">Saved Hooks</h2>
            <div className="grid grid-cols-1 gap-3 divide-y md:gap-6 divide-zinc-200 md:grid-cols-4">
              {user?.savedEvents && user?.savedEvents.length > 0 ? (
                <Events events={user.savedEvents} inProfile={true} />
              ) : (
                <div>No saved events found! 😔</div>
              )}
            </div>
          </section>
          <section>
            <h2 className="mt-6 mb-1 text-4xl">Created Events</h2>
            <div className="grid grid-cols-1 gap-3 divide-y md:gap-6 divide-zinc-200 md:grid-cols-4">
              {user?.createdEvents && user?.createdEvents.length > 0 ? (
                <Events
                  events={user.createdEvents}
                  inProfile={true}
                  deletable={true}
                />
              ) : (
                <div>No created events found! 😔</div>
              )}
            </div>
          </section>
        </>
      ) : (
        <ProfileLoader />
      )}
    </div>
  )
}

export default Profile
