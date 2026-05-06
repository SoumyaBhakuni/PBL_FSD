import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost } from "../features/postSlice";

/**
 * CreatePostModal Component
 * Handles multi-part form data (text + media) and UI state machine transitions.
 * @param {boolean} isOpen - Controls visibility from parent.
 * @param {function} setIsOpen - Setter function from parent's useState hook.
 */
export default function CreatePostModal({ isOpen, setIsOpen }) {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.posts);
  const dispatch = useDispatch();

  // Memory management: Revoke blob URLs on unmount or preview change
  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  if (!isOpen) return null;

  // Handles closing logic with event safety
  const closeSelf = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Prevents event bubbling to parent containers
    }
    if (typeof setIsOpen === 'function') {
      setIsOpen(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert("Maximum 5 files allowed.");
      return;
    }
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
  };

  const removeFile = (index, e) => {
    e.stopPropagation();
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Package data as FormData for Multer-based backend processing
    const formData = new FormData();
    formData.append("content", content);
    selectedFiles.forEach((file) => {
      formData.append("media", file); // Key matches backend upload.array("media")
    });

    try {
      // Execute thunk and unwrap promise to handle UI reset on success
      await dispatch(addPost(formData)).unwrap();
      setContent("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsOpen(false);
    } catch (err) {
      console.error("State Machine Error: Upload failed", err);
    }
  };

  return (
    /* BACKDROP LAYER */
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4"
      onClick={closeSelf}
    >
      {/* MODAL CONTENT CONTAINER */}
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()} // Prevents clicks inside from closing modal
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-black text-gray-800">Share an Update</h2>
          
          {/* FIX: Explicit type="button" prevents accidental form submission */}
          <button 
            type="button" 
            onClick={closeSelf} 
            className="text-gray-400 hover:text-gray-900 transition-colors text-2xl p-2 leading-none"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
              {user?.name?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{user?.name}</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {user?.role}
              </span>
            </div>
          </div>
          
          <textarea
            className="w-full h-32 border-none focus:ring-0 text-lg placeholder-gray-400 resize-none custom-scrollbar"
            placeholder="What's your latest project insight?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* MEDIA PREVIEW GRID */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                  <img src={url} className="w-full h-full object-cover" alt="preview" />
                  <button 
                    type="button"
                    onClick={(e) => removeFile(index, e)}
                    className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t">
            <label className="flex items-center space-x-2 cursor-pointer text-indigo-600 hover:text-indigo-700 transition-colors">
              <input 
                type="file" 
                multiple 
                className="hidden" 
                accept="image/*,video/*" 
                onChange={handleFileChange}
              />
              <span className="text-xl">🖼️</span>
              <span className="text-sm font-black uppercase tracking-widest">Add Media</span>
            </label>

            <button
              type="submit"
              disabled={loading || (!content.trim() && selectedFiles.length === 0)}
              className="bg-indigo-600 text-white px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}