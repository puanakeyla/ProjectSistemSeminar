<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SeminarStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only mahasiswa can create seminars
        return $this->user() && $this->user()->role === 'mahasiswa';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'judul' => [
                'required',
                'string',
                'max:500',
                'min:10',
            ],
            'jenis_seminar' => [
                'required',
                Rule::in(['proposal', 'hasil', 'kompre']),
            ],
            'pembimbing1_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $this->validateDosen($value, 'Pembimbing 1', $fail);
                },
            ],
            'pembimbing2_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $this->validateDosen($value, 'Pembimbing 2', $fail);
                },
            ],
            'penguji_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $this->validateDosen($value, 'Penguji', $fail);
                },
            ],
            'file_persyaratan' => [
                'required',
                'file',
                'mimes:pdf',
                'max:10240', // 10MB
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
            'judul.required' => 'Judul seminar wajib diisi.',
            'judul.string' => 'Judul harus berupa teks.',
            'judul.max' => 'Judul maksimal 500 karakter.',
            'judul.min' => 'Judul minimal 10 karakter.',
            
            'jenis_seminar.required' => 'Jenis seminar wajib dipilih.',
            'jenis_seminar.in' => 'Jenis seminar tidak valid.',
            
            'pembimbing1_id.required' => 'Pembimbing 1 wajib dipilih.',
            'pembimbing1_id.exists' => 'Pembimbing 1 tidak ditemukan.',
            
            'pembimbing2_id.required' => 'Pembimbing 2 wajib dipilih.',
            'pembimbing2_id.exists' => 'Pembimbing 2 tidak ditemukan.',
            
            'penguji_id.required' => 'Penguji wajib dipilih.',
            'penguji_id.exists' => 'Penguji tidak ditemukan.',
            
            'file_persyaratan.required' => 'File persyaratan wajib diunggah.',
            'file_persyaratan.file' => 'File persyaratan harus berupa file.',
            'file_persyaratan.mimes' => 'File persyaratan harus dalam format PDF.',
            'file_persyaratan.max' => 'File persyaratan maksimal 10MB.',
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
            'judul' => 'judul seminar',
            'jenis_seminar' => 'jenis seminar',
            'pembimbing1_id' => 'pembimbing 1',
            'pembimbing2_id' => 'pembimbing 2',
            'penguji_id' => 'penguji',
            'file_persyaratan' => 'file persyaratan',
        ];
    }

    /**
     * Validate that the selected user is a dosen.
     */
    private function validateDosen($userId, string $roleName, callable $fail): void
    {
        $dosen = User::find($userId);
        
        if (!$dosen) {
            $fail("{$roleName} tidak ditemukan.");
            return;
        }

        if ($dosen->role !== 'dosen') {
            $fail("{$roleName} harus berperan sebagai dosen.");
        }

        // Check for duplicate dosen selection
        $selectedDosenIds = [
            $this->pembimbing1_id,
            $this->pembimbing2_id,
            $this->penguji_id,
        ];

        if (count($selectedDosenIds) !== count(array_unique($selectedDosenIds))) {
            $fail('Pembimbing dan penguji harus berbeda.');
        }
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim string inputs
        $this->merge([
            'judul' => trim($this->judul),
        ]);
    }

    /**
     * Get the validated data from the request.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        // Add mahasiswa_id to validated data
        $validated['mahasiswa_id'] = $this->user()->id;

        return $validated;
    }
}