import React from 'react';
import UserTag from '@/app/components/UserTag';

function ArticleInfo({ articleDetails }) {
  const user = {
    name: articleDetails?.userName, 
    email: articleDetails?.userEmail, 
    image: articleDetails?.userImage 
  };

  return (
    <div>
      <UserTag user={user} theme="dark" />

      <h2 className='text-[30px] my-5 font-bold mb-10'>{articleDetails?.title}</h2> 
 
      
      <h2 className='mt-10 -translate-y-8'>{articleDetails?.desc}</h2>
    </div>
  );
}

export default ArticleInfo;
