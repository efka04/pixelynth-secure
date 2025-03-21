import React, { useState } from 'react'
import { HiArrowUpCircle } from "react-icons/hi2";
function UploadImage({setFile}) {
   const [selectedFile,setSelectedFile]=useState();


  return (
    <div className='h-[450px] bg-[#e9e9e9] rounded-md flex items-center justify-center p-4'>
        
        <label className='flex flex-col justify-center items-center
        cursor-pointer w-[95%] h-[90%] 
        border-[2px] border-gray-300 border-dashed rounded-md text-gray-600 '>
           
          {!selectedFile?
          <div className='flex items-center flex-col'>
           <HiArrowUpCircle className='text-[22px]'/>   
            <h3 className=' font-semibold'>Click to Upload</h3>
            </div>
            :null}
            {selectedFile?
            <img src={window.URL.createObjectURL(selectedFile)}
            alt='selected-image'
            width={500}
            height={800}
            className='object-contain h-[90%]'
            />:null}
            <input id="dropzone-file" type="file"
             className="hidden"  
             onChange={(e)=>{setFile(e.target.files[0]);
             setSelectedFile(e.target.files[0])}} />
        
        </label>
    </div>
  )
}

export default UploadImage