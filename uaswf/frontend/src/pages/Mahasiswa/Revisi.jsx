import { useState } from 'react';
import './Revisi.css';

function Revisi() {
  const [revisiList] = useState([
    {
      id: 1,
      jenis: 'Seminar Proposal',
      tanggal_seminar: '15 November 2025',
      catatan: 'Perbaiki metodologi penelitian pada bab 3, tambahkan diagram flowchart',
      status: 'Belum Upload',
      deadline: '25 November 2025'
    },
    {
      id: 2,
      jenis: 'Seminar Hasil',
      tanggal_seminar: '10 November 2025',
      catatan: 'Perbaiki hasil analisis data dan kesimpulan',
      status: 'Sudah Upload',
      deadline: '20 November 2025',
      file_upload: 'revisi_hasil_20241110.pdf'
    }
  ]);

  const [uploadModal, setUploadModal] = useState(false);
  const [selectedRevisi, setSelectedRevisi] = useState(null);

  const handleUpload = (revisi) => {
    setSelectedRevisi(revisi);
    setUploadModal(true);
  };

  return (
    <div className="revisi-wrapper">
      <div className="revisi-header">
        <h1>Revisi Seminar</h1>
        <p>Daftar revisi dan catatan dari dosen pembimbing/penguji</p>
      </div>

      <div className="revisi-content">
        {revisiList.map((revisi) => (
          <div key={revisi.id} className="revisi-card">
            <div className="revisi-card-header">
              <div>
                <span className="jenis-badge">{revisi.jenis}</span>
                <h3>Revisi {revisi.jenis}</h3>
              </div>
              <span className={`status-badge ${revisi.status === 'Sudah Upload' ? 'uploaded' : 'pending'}`}>
                {revisi.status}
              </span>
            </div>

            <div className="revisi-card-body">
              <div className="info-row">
                <span className="icon">📅</span>
                <div>
                  <span className="label">Tanggal Seminar</span>
                  <span className="value">{revisi.tanggal_seminar}</span>
                </div>
              </div>

              <div className="info-row">
                <span className="icon">⏰</span>
                <div>
                  <span className="label">Deadline Upload</span>
                  <span className="value deadline">{revisi.deadline}</span>
                </div>
              </div>

              <div className="catatan-section">
                <span className="icon">📝</span>
                <div>
                  <span className="label">Catatan Revisi</span>
                  <p className="catatan-text">{revisi.catatan}</p>
                </div>
              </div>

              {revisi.file_upload && (
                <div className="info-row">
                  <span className="icon">📎</span>
                  <div>
                    <span className="label">File yang Diupload</span>
                    <span className="value file-link">{revisi.file_upload}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="revisi-card-footer">
              {revisi.status === 'Sudah Upload' ? (
                <>
                  <button className="btn-download">Download File</button>
                  <button className="btn-reupload" onClick={() => handleUpload(revisi)}>
                    Upload Ulang
                  </button>
                </>
              ) : (
                <button className="btn-upload" onClick={() => handleUpload(revisi)}>
                  Upload Revisi
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {uploadModal && (
        <div className="modal-overlay" onClick={() => setUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload File Revisi</h2>
              <button className="modal-close" onClick={() => setUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="upload-area">
                <span className="upload-icon">📄</span>
                <p>Klik atau drag file ke sini</p>
                <input type="file" accept=".pdf,.doc,.docx" />
              </div>
              <div className="form-group">
                <label>Keterangan</label>
                <textarea rows="3" placeholder="Keterangan tambahan (opsional)"></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setUploadModal(false)}>Batal</button>
              <button className="btn-submit">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Revisi;
