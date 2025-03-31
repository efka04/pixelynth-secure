"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import DragDropZone from './components/DragDropZone';
import Form from './components/FormAdd';
import { IoClose } from 'react-icons/io5';
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner';
import { uploadImageWithCache } from '@/lib/firebaseStorage';


export default function MultiUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [uploadForms, setUploadForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const scrollBarRef = useRef(null);

  // Change le titre de la page
  useEffect(() => {
    document.title = 'Upload Image - Pixelynth';
  }, []);

  // Empêche la fermeture accidentelle si des uploads sont en attente
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploadForms.length > 0) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.preventDefault();
        (e || window.event).returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadForms]);

  // Gère le défilement horizontal et calcule le pourcentage
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const progress = (container.scrollLeft / scrollWidth) * 100;
      setScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [uploadForms]);

  // Ajoute des formulaires lors du drop de fichiers
  const handleFilesDrop = (acceptedFiles) => {
    const newForms = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      formRef: React.createRef()
    }));
    setUploadForms(prev => [...prev, ...newForms]);
  };

  // Retourne les formulaires non publiés
  const getPendingForms = () => {
    return uploadForms.filter(form => !form.formRef.current?.isPublished);
  };

  // Gestion de l'upload de tous les fichiers
  const handleUploadAll = async () => {
    setLoading(true);
    try {
      const pendingForms = getPendingForms();
      const results = await Promise.all(
        pendingForms.map(async form => {
          if (form.formRef.current) {
            try {
              const downloadURL = await uploadImageWithCache(form.file);
              const success = await form.formRef.current.submitForm(downloadURL);
              setUploadStatus(prev => ({
                ...prev,
                [form.id]: success ? 'success' : 'error'
              }));
              return { id: form.id, success };
            } catch (error) {
              setUploadStatus(prev => ({
                ...prev,
                [form.id]: 'error'
              }));
              return { id: form.id, success: false };
            }
          }
          return { id: form.id, success: false };
        })
      );

      // Supprime les formulaires uploadés avec succès
      setUploadForms(prev => prev.filter(form => !results.find(r => r.id === form.id && r.success)));

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        alert(`Successfully uploaded ${successCount} images.${failCount > 0 ? ` ${failCount} failed and remain for retry.` : ''}`);
      }
    } catch (error) {
      console.error('Error during upload:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveForm = (formId) => {
    setUploadForms(prev => prev.filter(form => form.id !== formId));
  };

  // Gestion du défilement par la scrollbar personnalisée
  const updateScrollPosition = (e) => {
    const scrollBar = scrollBarRef.current;
    const container = containerRef.current;
    if (!scrollBar || !container) return;

    const scrollBarRect = scrollBar.getBoundingClientRect();
    let percentage = (e.clientX - scrollBarRect.left) / scrollBarRect.width;
    percentage = Math.max(0, Math.min(1, percentage));

    const scrollWidth = container.scrollWidth - container.clientWidth;
    container.scrollLeft = percentage * scrollWidth;
  };

  const handleScrollBarMouseDown = (e) => {
    setIsDraggingScroll(true);
    updateScrollPosition(e);
  };

  const handleScrollBarMouseMove = (e) => {
    if (!isDraggingScroll) return;
    updateScrollPosition(e);
  };

  const handleScrollBarMouseUp = () => {
    setIsDraggingScroll(false);
  };

  useEffect(() => {
    if (isDraggingScroll) {
      document.addEventListener('mousemove', handleScrollBarMouseMove);
      document.addEventListener('mouseup', handleScrollBarMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleScrollBarMouseMove);
        document.removeEventListener('mouseup', handleScrollBarMouseUp);
      };
    }
  }, [isDraggingScroll]);

  // Vérifie la session dès que le statut n'est plus "loading"
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      //router.replace("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="container mx-auto p-4">
        <DragDropZone onFilesDrop={handleFilesDrop} />

        {uploadForms.length > 0 && (
          <>
            <div className="relative max-w-[1400px] mx-auto">
              <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

              <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto py-8 px-8 snap-x"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#000000 #e5e7eb'
                }}
              >
                {/* Spacer pour centrer */}
                <div className="min-w-[calc(50%-175px)] md:min-w-[calc(50%-250px)] flex-shrink-0" />

                {uploadForms.map(form => (
                  <div
                    key={form.id}
                    className={`w-[300px] md:w-[500px] flex-shrink-0 snap-center shadow-lg rounded-md bg-white relative ${uploadStatus[form.id] === 'error' ? 'border-2 border-red-500' : ''}`}
                  >
                    <button
                      onClick={() => handleRemoveForm(form.id)}
                      className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      <IoClose size={20} />
                    </button>
                    <Form
                      ref={form.formRef}
                      initialFile={form.file}
                      isBulkUpload={true}
                      onClose={() => handleRemoveForm(form.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleUploadAll}
              disabled={loading || getPendingForms().length === 0}
              className="fixed bottom-20 right-4 bg-black text-white px-8 py-4 rounded-full shadow-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors z-50"
            >
              {loading ? 'Uploading...' : `Upload All (${getPendingForms().length})`}
            </button>
          </>
        )}
      </div>
    );
  }

  // Retourne null par défaut (pendant la redirection)
  return null;
}
