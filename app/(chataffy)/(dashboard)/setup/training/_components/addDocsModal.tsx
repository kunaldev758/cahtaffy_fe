'use client';
import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import { FileUpload } from './fileUpload';
import { openaiCreateSnippet } from '@/app/_api/dashboard/action';

export default function AddContentModal({ showModal, onHide }: any) {
  const [toggle, setToggle] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonOnClick = async () => {
    if (toggle && title.trim().length === 0) {
      toast.error("Enter Title");
      return false;
    }

    if (toggle && content.trim().length === 0) {
      toast.error("Enter Content");
      return false;
    }

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (toggle) {
      formData.append('title', title);
      formData.append('content', content);
    }

    setButtonLoading(true);
    const response: any = await openaiCreateSnippet(formData)
    setButtonLoading(false)
    onHide()
    toast.success(response.message)
  };

  return (
    <>
      <Modal show={showModal} onHide={onHide} size='sm' centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title as='h1'>Add New Doc/Snippets</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="new-webPage-modalArea">
            <FileUpload onFileChange={setFile} />
            <hr />
            <div className="snippetsAdd-area">
              <div className="specific-urlHeading">
                <h4>You can also provide Snippets</h4>
                <label className="toggle">
                  <input className="toggle-checkbox" type="checkbox" checked={toggle} onChange={() => setToggle(!toggle)} />
                  <div className="toggle-switch"></div>
                </label>
              </div>
              {toggle && (
                <>
                  <div className="input-box">
                    <input type="text" placeholder="Enter a title" className="form-control" value={title} onChange={(event) => setTitle(event.target.value)} />
                  </div>
                  <div className="specific-urlBox mt-20">
                    <textarea className="form-control" placeholder="Start writing your content..." value={content} onChange={(event) => setContent(event.target.value)}></textarea>
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-content-space-between">
          <button type="button" className="custom-btn default-btn" onClick={onHide}>Cancel</button>
          <button type="button" className="custom-btn" onClick={handleButtonOnClick} disabled={buttonLoading}>
            {buttonLoading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Save'}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
