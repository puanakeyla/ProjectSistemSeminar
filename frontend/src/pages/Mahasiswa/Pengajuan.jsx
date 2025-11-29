import { useState, useEffect } from 'react';
import './Pengajuan.css';
import axios from 'axios';
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react'

const API_URL = 'http://localhost:8000/api';

function Pengajuan() {
  const [formData, setFormData] = useState({
    jenis: '',
    judul: '',
    abstrak: '',
    pembimbing1_id: '',
    pembimbing2_id: '',
    penguji_id: '',
    berkas: null
  });

  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [berkasFileName, setBerkasFileName] = useState('');

  // Fetch dosen list saat component mount
  useEffect(() => {
    fetchDosenList();
  }, []);

  const fetchDosenList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mahasiswa/dosens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDosenList(response.data.data || []);
    } catch (err) {
      console.error('Error fetching dosen list:', err);
      setError('Gagal memuat daftar dosen');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError(''); // Clear error saat user mengetik
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      const allowedTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
      if (!allowedTypes.includes(file.type)) {
        setError('File harus berupa PDF atau ZIP');
        e.target.value = '';
        return;
      }

      // Validasi ukuran file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, berkas: file });
      setBerkasFileName(file.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validasi form
    if (!formData.berkas) {
      setError('Berkas persyaratan wajib diupload');
      setLoading(false);
      return;
    }

    // Validasi dosen harus berbeda
    if (formData.pembimbing1_id === formData.pembimbing2_id ||
        formData.pembimbing1_id === formData.penguji_id ||
        formData.pembimbing2_id === formData.penguji_id) {
      setError('Pembimbing 1, Pembimbing 2, dan Penguji harus berbeda');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Prepare FormData untuk upload file
      const formDataToSend = new FormData();
      formDataToSend.append('judul', formData.judul);
      formDataToSend.append('tipe', formData.jenis); // jenis -> tipe
      formDataToSend.append('abstrak', formData.abstrak);
      formDataToSend.append('pembimbing1_id', formData.pembimbing1_id);
      formDataToSend.append('pembimbing2_id', formData.pembimbing2_id);
      formDataToSend.append('penguji_id', formData.penguji_id);
      formDataToSend.append('file_berkas', formData.berkas); // berkas -> file_berkas

      const response = await axios.post(
        `${API_URL}/mahasiswa/seminars`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(response.data.message || 'Seminar berhasil diajukan!');

      // Reset form
      setFormData({
        jenis: '',
        judul: '',
        abstrak: '',
        pembimbing1_id: '',
        pembimbing2_id: '',
        penguji_id: '',
        berkas: null
      });
      setBerkasFileName('');

      // Redirect ke halaman status setelah 2 detik
      setTimeout(() => {
        window.location.href = '/mahasiswa/status';
      }, 2000);

    } catch (err) {
      console.error('Error submitting seminar:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat();
        setError(errors.join(', '));
      } else {
        setError('Gagal mengajukan seminar. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pengajuan-wrapper">
      <div className="pengajuan-header">
        <h1>Pengajuan Seminar</h1>
        <p>Form pengajuan seminar proposal/hasil/komprehensif</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle className="w-5 h-5 inline mr-2" />
          <p>{success}</p>
        </div>
      )}

      <div className="pengajuan-content">
        <form onSubmit={handleSubmit} className="pengajuan-form">
          <div className="form-row">
            <div className="form-group">
              <label>Jenis Seminar <span className="required">*</span></label>
              <select
                name="jenis"
                value={formData.jenis}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Pilih jenis seminar</option>
                <option value="proposal">Seminar Proposal</option>
                <option value="hasil">Seminar Hasil</option>
                <option value="kompre">Komprehensif</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Judul Penelitian <span className="required">*</span></label>
            <input
              type="text"
              name="judul"
              value={formData.judul}
              onChange={handleChange}
              placeholder="Masukkan judul penelitian"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Abstrak</label>
            <textarea
              name="abstrak"
              value={formData.abstrak}
              onChange={handleChange}
              rows="5"
              placeholder="Ringkasan singkat penelitian (opsional)"
              disabled={loading}
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pembimbing 1 <span className="required">*</span></label>
              <select
                name="pembimbing1_id"
                value={formData.pembimbing1_id}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Pilih Pembimbing 1</option>
                {dosenList.map((dosen) => (
                  <option key={dosen.id} value={dosen.id}>
                    {dosen.name} {dosen.nidn ? `(${dosen.nidn})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pembimbing 2 <span className="required">*</span></label>
              <select
                name="pembimbing2_id"
                value={formData.pembimbing2_id}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Pilih Pembimbing 2</option>
                {dosenList.map((dosen) => (
                  <option key={dosen.id} value={dosen.id}>
                    {dosen.name} {dosen.nidn ? `(${dosen.nidn})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Penguji <span className="required">*</span></label>
            <select
              name="penguji_id"
              value={formData.penguji_id}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Pilih Penguji</option>
              {dosenList.map((dosen) => (
                <option key={dosen.id} value={dosen.id}>
                  {dosen.name} {dosen.nidn ? `(${dosen.nidn})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Upload Berkas Persyaratan <span className="required">*</span></label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="berkas"
                name="berkas"
                onChange={handleFileChange}
                accept=".pdf,.zip"
                required
                disabled={loading}
                style={{ display: 'none' }}
              />
                <label htmlFor="berkas" className="file-upload-label">
                <FileText className="w-4 h-4 inline mr-2" />
                <span className="file-text">
                  {berkasFileName || 'Pilih file (PDF/ZIP, max 10MB)'}
                </span>
              </label>
            </div>
            <small className="form-hint">
              * Upload berkas persyaratan dalam format PDF atau ZIP (maksimal 10MB)
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.history.back()}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Ajukan Seminar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Pengajuan;
