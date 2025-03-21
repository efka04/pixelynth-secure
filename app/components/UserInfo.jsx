import Image from 'next/image';
import React from 'react'
import { signOut,useSession } from "next-auth/react"
import { useRouter } from 'next/navigation';

function UserInfo({userInfo}) {
    const router=useRouter();
    const {data:session}=useSession()
    const onLogoutClick=()=>{
      signOut();
      router.push("/")
    }
  return (
    <div className='bg-white flex flex-col items-center p-16 rounded-2xl shadow-md'>
        <Image src={userInfo.userImage || '/default-avatar.webp'}
        alt='userImage'
        width={100}
        height={100}
        className='rounded-full'/>

        <h3 className='text-[30px]
        font-semibold'>{userInfo.userName}</h3>
        <h3 className='text-gray-400'>{userInfo.userEmail}</h3>
        <div className='flex gap-4'>
        <button className='bg-gray-200
         p-2 px-3 font-semibold mt-5 rounded-full'>Partager</button>
        {session?.user.email== userInfo.userEmail? <button className='bg-gray-200
         p-2 px-3 font-semibold mt-5 rounded-full'
         onClick={()=>onLogoutClick()}>Déconnexion</button>:null}
      </div>
    </div>
  )
}

export default UserInfo