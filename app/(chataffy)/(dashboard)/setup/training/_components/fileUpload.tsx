"use client";
import { useState } from "react";
import Image from 'next/image';
import fileUploadImage from '@/images/file-upload.svg';

export const FileUpload = ({ onFileChange }: { onFileChange: (file: File | null) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileEnter, setFileEnter] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const uploadedFile = files[0];
      if (["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(uploadedFile.type)) {
        setFile(uploadedFile);
        onFileChange(uploadedFile);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFileEnter(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFileEnter(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFileEnter(false);
  };

  return (
    <div
      className={`dragUpload-area ${fileEnter ? 'drag-enter' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="upload-fileIcon">
        <Image src={fileUploadImage} alt="" width={65} height={65} />
      </div>
      <div className="upload-fileHeading">
        Drop your file here, or <label htmlFor="file" className="upload-browse">browse</label>
      </div>
      <div className="upload-filePera">Only DOC, DOCX, PDF, TXT files are allowed.</div>
      {file && <div style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>{file.name}</div>}
      <input
        id="file"
        type="file"
        className="hidden"
        accept=".doc,.docx,.pdf,.txt"
        onChange={(e) => handleFileChange(e.target.files)}
      />
    </div>
  );
};
