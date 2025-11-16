<?php

namespace App\Http\Requests;

use App\Models\Seminar;
use Illuminate\Foundation\Http\FormRequest;

class RevisionStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only mahasiswa can submit revisions
        if (!$this->user() || $this->user()->role !== 'mahasiswa') {
            return false;
        }

        // Check if seminar belongs to the mahasiswa and is approved
        $seminar = Seminar::where('id', $this->seminar_id)
            ->where('mahasiswa_id', $this->user()->id)
            ->where('status', 'disetujui')
            ->first();

        return (bool) $seminar;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'seminar_id' => [
                'required',
                'exists:seminars,id',
            ],
            'file_revisi' => [
                'required',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240', // 10MB
            ],
            'catatan_mahasiswa' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'seminar_id.required' => 'Seminar wajib dipilih.',
            'seminar_id.exists' => 'Seminar tidak ditemukan.',
            
            'file_revisi.required' => 'File revisi wajib diunggah.',
            'file_revisi.file' => 'File revisi harus berupa file.',
            'file_revisi.mimes' => 'File revisi harus dalam format PDF, DOC, atau DOCX.',
            'file_revisi.max' => 'File revisi maksimal 10MB.',
            
            'catatan_mahasiswa.string' => 'Catatan harus berupa teks.',
            'catatan_mahasiswa.max' => 'Catatan maksimal 1000 karakter.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'seminar_id' => 'seminar',
            'file_revisi' => 'file revisi',
            'catatan_mahasiswa' => 'catatan mahasiswa',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim string inputs
        $this->merge([
            'catatan_mahasiswa' => trim($this->catatan_mahasiswa),
        ]);
    }

    /**
     * Get the validated data from the request.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        // Add additional data to validated data
        $validated['tanggal_pengumpulan'] = now();
        $validated['status'] = 'menunggu';

        return $validated;
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization()
    {
        $seminar = Seminar::find($this->seminar_id);

        if (!$seminar) {
            abort(404, 'Seminar tidak ditemukan.');
        }

        if ($seminar->mahasiswa_id !== $this->user()->id) {
            abort(403, 'Anda tidak memiliki akses ke seminar ini.');
        }

        if ($seminar->status !== 'disetujui') {
            abort(422, 'Hanya dapat mengumpulkan revisi untuk seminar yang telah disetujui.');
        }

        abort(403, 'Anda tidak diizinkan untuk melakukan tindakan ini.');
    }
}