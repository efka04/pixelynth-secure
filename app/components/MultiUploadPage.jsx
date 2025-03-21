'use client';

import React, { useState, useRef } from 'react';
import DragDropZone from "@/app/account/[userName]/upload/components/DragDropZone";
import UploadFormsContainer from "@/app/account/[userName]/upload/components/UploadFormsContainer";
import UploadAllButton from "@/app/account/[userName]/upload/components/UploadAllButton";

export default function MultiUploadPage({ session }) {
  const [uploadForms, setUploadForms] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [loading, setLoading] = useState(false);

  const handleFilesDrop = (files) => {
    const newForms = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      formRef: React.createRef() // Add form reference
    }));
    setUploadForms(prev => [...prev, ...newForms]);
  };

  const handleRemoveForm = (formId) => {
    setUploadForms(prev => prev.filter(form => form.id !== formId));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[formId];
      return newStatus;
    });
  };

  const getPendingForms = () => {
    return uploadForms.filter(form => form.status === 'pending');
  };

  const handleUploadAll = async () => {
    setLoading(true);
    try {
      const pendingForms = getPendingForms();
      
      for (const form of pendingForms) {
        try {
          // Check if form has required data
          if (!form.file) {
            console.error('No file found for form:', form.id);
            continue;
          }

          // Create form data
          const formData = new FormData();
          formData.append('file', form.file);
          
          // Add to temporary collection
          // TODO: Implement your actual upload logic here
          
          setUploadStatus(prev => ({
            ...prev,
            [form.id]: 'success'
          }));
          
        } catch (error) {
          console.error('Error uploading form:', form.id, error);
          setUploadStatus(prev => ({
            ...prev,
            [form.id]: 'error'
          }));
        }
      }

      // Remove successful uploads
      setUploadForms(prev => 
        prev.filter(form => uploadStatus[form.id] !== 'success')
      );

    } catch (error) {
      console.error('Error during upload:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <DragDropZone onFilesDrop={handleFilesDrop} />
      {uploadForms.length > 0 && (
        <>
          <UploadFormsContainer 
            uploadForms={uploadForms}
            uploadStatus={uploadStatus}
            onRemoveForm={handleRemoveForm}
          />
          <UploadAllButton 
            onClick={handleUploadAll}
            loading={loading}
            pendingCount={getPendingForms().length}
          />
        </>
      )}
    </div>
  );
}
