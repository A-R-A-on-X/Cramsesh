import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './MaterialsPage.css';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const { refreshUser } = useAuth();

  useEffect(() => {
    api.get('/materials').then(r => setMaterials(r.data)).catch(console.error);
  }, []);

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const file = accepted[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress('Uploading file...');

    try {
      setUploadProgress('Extracting text & generating lessons with AI...');
      const res = await api.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`${res.data.lessons.length} lessons generated! +${res.data.xpEarned} XP`);
      const updated = await api.get('/materials');
      setMaterials(updated.data);
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }, [refreshUser]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material and all its lessons?')) return;
    try {
      await api.delete(`/materials/${id}`);
      setMaterials(m => m.filter(x => x.id !== id));
      toast.success('Material deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const fileTypeIcon = (type) => {
    if (type?.includes('pdf')) return '📕';
    if (type?.includes('word') || type?.includes('doc')) return '📘';
    if (type?.includes('text')) return '📄';
    if (type?.includes('image')) return '🖼️';
    return '📂';
  };

  return (
    <div className="materials-page page-animate">
      <div className="page-header">
        <h1 className="page-title">Study Materials</h1>
        <p className="page-subtitle">Upload your notes, textbooks, or documents — AI will generate lessons automatically</p>
      </div>

      {/* Drop zone */}
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}>
        <input {...getInputProps()} />
        {uploading ? (
          <div className="drop-uploading">
            <div className="upload-orbit">
              <div className="orbit-ring" />
              <div className="orbit-nucleus">🤖</div>
            </div>
            <p className="upload-status">{uploadProgress}</p>
            <p className="upload-hint">AI is processing your material...</p>
          </div>
        ) : (
          <div className="drop-content">
            <div className="drop-icon">{isDragActive ? '🎯' : '📤'}</div>
            <p className="drop-title">
              {isDragActive ? 'Drop it here!' : 'Drag & drop your study material'}
            </p>
            <p className="drop-sub">PDF, DOCX, TXT, or images — up to 10MB</p>
            <button className="btn btn-primary" type="button">Browse Files</button>
          </div>
        )}
      </div>

      {/* Materials list */}
      {materials.length > 0 && (
        <div className="materials-section">
          <h2 className="section-heading">Uploaded Materials ({materials.length})</h2>
          <div className="materials-list">
            {materials.map(m => (
              <div key={m.id} className="material-item">
                <div className="material-icon">{fileTypeIcon(m.file_type)}</div>
                <div className="material-info">
                  <div className="material-name">{m.original_name}</div>
                  <div className="material-meta">
                    <span>{formatSize(m.size)}</span>
                    <span>•</span>
                    <span>{new Date(m.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(m.id)}
                >🗑 Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {materials.length === 0 && !uploading && (
        <div className="empty-state">
          <div className="icon">📚</div>
          <h3>No materials yet</h3>
          <p>Upload a document to get started with AI-generated lessons</p>
        </div>
      )}
    </div>
  );
}
