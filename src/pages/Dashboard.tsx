import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Database } from '../types/supabase';
// Import Pencil icon at the top with other icons
import { Search, Phone, MapPin, Calendar, Trash2, Pencil, Bell, User } from 'lucide-react';


type Jemaat = Database['public']['Tables']['jemaat']['Row'];

// Add new type for image modal
type ImageModalProps = {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
};

// Add ImageModal component
const ImageModal = ({ isOpen, imageUrl, onClose }: ImageModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 backdrop-blur-sm bg-black/70" onClick={onClose}></div>
      <div className="relative z-50 max-w-4xl max-h-[90vh]">
        <img
          src={imageUrl}
          alt="Zoomed"
          className="object-contain w-auto h-auto max-w-full max-h-[90vh]"
        />
        <button
          onClick={onClose}
          className="absolute p-2 text-white rounded-full top-4 right-4 bg-black/50 hover:bg-black/70"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Tambahkan fungsi calculateAge sebelum AddJemaatModal
const calculateAge = (birthday: string): number => {
  // Format input DD-MM-YYYY
  const [day, month, year] = birthday.split('-').map(Number);

  // Buat objek tanggal dari input
  const birthDate = new Date(year, month - 1, day); // month - 1 karena bulan di JavaScript dimulai dari 0
  const today = new Date();

  // Hitung selisih tahun
  let age = today.getFullYear() - birthDate.getFullYear();

  // Sesuaikan jika belum ulang tahun di tahun ini
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Validasi umur
  if (age < 0 || age > 150) {
    return 0; // Return 0 jika umur tidak valid
  }

  return age;
};

export default function Dashboard() {
  // Add this with other state declarations at the top
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 9; // Ubah menjadi 9 data per halaman
  const { user, signOut } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedJemaatId, setSelectedJemaatId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Ref untuk menyimpan timeout ID
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Tambahkan state untuk mode edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedJemaat, setSelectedJemaat] = useState<Jemaat | null>(null);
  // Tambahkan state untuk menyimpan notifikasi ulang tahun
  const [birthdayNotifications, setBirthdayNotifications] = useState<Jemaat[]>([]);
  // Tambahkan state untuk modal notifikasi
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null); // State untuk menyimpan peran pengguna
  const [userName, setUserName] = useState<string | null>(null); // State untuk menyimpan nama pengguna

  useEffect(() => {
    fetchJemaat(); // Panggil fetchJemaat saat komponen dimuat
  }, [currentPage]); // Hanya bergantung pada currentPage

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('admins')
          .select('role')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
        } else {
          setUserRole(data?.role || null);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('admins')
          .select('name') // Ambil nama pengguna
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error fetching user details:', error);
        } else {
          setUserName(data?.name || null);
        }
      }
    };

    fetchUserDetails();
  }, [user]);


  async function fetchJemaat() {
    try {
      setLoading(true);

      // Hitung offset berdasarkan halaman saat ini
      const offset = (currentPage - 1) * itemsPerPage;

      const query = supabase
        .from('jemaat')
        .select('id, full_name, created_at, photo, phone, birthday, age, address, gender, is_new, is_baptis, marital_status, registered_by', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Jika ada searchTerm, tambahkan filter untuk nama ATAU nomor telepon
      if (searchTerm) {
        query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // Tambahkan range setelah filter
      const { data, error, count } = await query.range(offset, offset + itemsPerPage - 1);

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Fetched data:', data);
        console.log('Total count:', count);
        setJemaatList(data);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching jemaat data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage)); // Menghitung total halaman, minimal 1 halaman

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchClick = () => {
    setCurrentPage(1); // Reset ke halaman pertama saat mencari
    fetchJemaat(); // Panggil fungsi fetchJemaat saat tombol diklik
  };

  const handleDeleteClick = (id: string) => {
    console.log('Selected ID for deletion:', id);
    const jemaat = jemaatList.find(j => j.id === id);
    console.log('Found jemaat:', jemaat);
    setSelectedJemaatId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedJemaatId) return;

    try {
      setLoading(true);

      // Get jemaat data first to get the photo URL
      const { data: jemaatData, error: fetchError } = await supabase
        .from('jemaat')
        .select('photo, phone')
        .eq('id', selectedJemaatId)
        .single();

      if (fetchError) {
        console.error('Error fetching jemaat data:', fetchError);
        throw fetchError;
      }

      // If there's a photo, delete it from storage
      if (jemaatData?.photo) {
        // List all files with the phone number pattern
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('hg2')
          .list();

        if (!listError && existingFiles && jemaatData.phone) {
          // Find files that match the phone number
          const filesToDelete = existingFiles.filter(file =>
            file.name.startsWith(jemaatData.phone as string)
          );

          if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
              .from('hg2')
              .remove(filesToDelete.map(file => file.name));

            if (deleteError) {
              console.error('Error deleting photo files:', deleteError);
            }
          }
        }
      }

      // Delete the jemaat record
      const { error } = await supabase
        .from('jemaat')
        .delete()
        .eq('id', selectedJemaatId);

      if (error) {
        console.error('Error deleting:', error);
        throw error;
      }

      // Jika tidak ada error, berarti penghapusan berhasil
      console.log('Delete successful');

      // Update state secara langsung
      setJemaatList(prevList => prevList.filter(jemaat => jemaat.id !== selectedJemaatId));
      setTotalCount(prev => prev - 1);

      // Jika halaman saat ini kosong setelah penghapusan, kembali ke halaman sebelumnya
      if (jemaatList.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        // Jika masih di halaman yang sama, refresh data
        await fetchJemaat();
      }

      // Tambahkan notifikasi sukses
      // alert('Data jemaat berhasil dihapus');

      if (!error) {
        await fetchJemaat();
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setSelectedJemaatId(null);
        }, 500);
      }

    } catch (error) {
      console.error('Error deleting jemaat:', error);
      alert('Gagal menghapus data jemaat. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setSelectedJemaatId(null);
    }
  };

  // Modifikasi fungsi handleEditClick
  const handleEditClick = (jemaat: Jemaat) => {
    setSelectedJemaat(jemaat);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  // Modifikasi AddJemaatModal untuk mendukung mode edit
  const AddJemaatModal = ({
    isOpen,
    onClose
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const [formData, setFormData] = useState({
      full_name: '',
      phone: '',
      birthday: '',
      address: '',
      photo: null as File | null,
      gender: '',
      is_new: false,
      is_baptis: false,
      marital_status: ''
    });
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form saat modal dibuka/ditutup
    useEffect(() => {
      if (isOpen) {
        if (isEditMode && selectedJemaat) {
          // Isi form dengan data yang akan diedit
          setFormData({
            full_name: selectedJemaat.full_name,
            phone: selectedJemaat.phone || '',
            birthday: selectedJemaat.birthday ? formatDate(selectedJemaat.birthday) : '',
            address: selectedJemaat.address || '',
            photo: null,
            gender: selectedJemaat.gender || '',
            is_new: selectedJemaat.is_new ?? false,
            is_baptis: selectedJemaat.is_baptis ?? false,
            marital_status: selectedJemaat.marital_status ?? ''
          });
          setPreview(selectedJemaat.photo?.toString() || null);
        } else {
          // Reset form untuk mode tambah
          setFormData({
            full_name: '',
            phone: '',
            birthday: '',
            address: '',
            photo: null,
            gender: '',
            is_new: false,
            is_baptis: false,
            marital_status: ''
          });
          setPreview(null);
        }
      }
    }, [isOpen, isEditMode, selectedJemaat]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Khusus untuk nomor telepon, hanya terima angka
      if (name === 'phone') {
        const numbersOnly = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({
          ...prev,
          [name]: numbersOnly
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData(prev => ({
          ...prev,
          photo: file
        }));
        // Buat preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const formatDateForInput = (dateStr: string) => {
      try {
        if (!dateStr) return '';
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
      }
    };

    const formatDateForSubmit = (dateString: string): string => {
      if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
        return dateString;
      }

      const [day, month, year] = dateString.split(/[/ -]/).map(Number);
      if (day && month && year) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      return dateString; // Return as-is if format is unrecognized

    };

    // Modifikasi handleSubmit untuk menangani foto dengan benar
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        let photoUrl = isEditMode ? selectedJemaat?.photo : null;

        // Handle foto upload
        if (formData.photo) {
          try {
            // 1. Hapus foto lama jika ada
            if (isEditMode && selectedJemaat?.photo) {
              const oldPhotoUrl = selectedJemaat.photo.toString();
              console.log('Old photo URL:', oldPhotoUrl);

              // Ekstrak nama file dari URL
              const oldFileName = oldPhotoUrl.split('/').pop()?.split('?')[0];
              if (oldFileName) {
                console.log('Deleting old photo:', oldFileName);
                const { error: deleteError } = await supabase.storage
                  .from('hg2')
                  .remove([oldFileName]);

                if (deleteError) {
                  console.error('Error deleting old photo:', deleteError);
                } else {
                  console.log('Old photo deleted successfully');
                  // Tunggu sebentar setelah penghapusan
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }

            // 2. Upload foto baru dengan nama yang unik
            const fileExt = formData.photo.name.split('.').pop()?.toLowerCase() || 'png';
            const uniqueId = Date.now();
            const fileName = `${formData.phone || uniqueId}_${uniqueId}.${fileExt}`;

            console.log('Preparing to upload new photo:', fileName);

            // Tunggu sebentar sebelum upload
            await new Promise(resolve => setTimeout(resolve, 500));

            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('hg2')
              .upload(fileName, formData.photo, {
                cacheControl: '0',
                upsert: true
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw uploadError;
            }

            console.log('Upload successful:', uploadData);

            // 3. Dapatkan URL publik
            const { data } = supabase.storage
              .from('hg2')
              .getPublicUrl(fileName);

            photoUrl = data.publicUrl;
            console.log('New photo URL:', photoUrl);

            // 4. Tunggu sebentar setelah upload
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.error('Error handling file upload:', error);
            throw new Error('Gagal mengupload foto. Silakan coba lagi.');
          }
        }

        // Format tanggal dan hitung umur
        const formattedBirthday = formData.birthday ? formatDateForSubmit(formData.birthday) : null;
        const age = formData.birthday ? calculateAge(formData.birthday) : null;

        const jemaatData = {
          full_name: formData.full_name,
          gender: formData.gender,
          age: age,
          phone: formData.phone || null,
          address: formData.address || null,
          birthday: formattedBirthday,
          registered_by: user?.email || 'system',
          photo: photoUrl // Pastikan ini string atau null
        };

        console.log('Data to be saved:', jemaatData);

        let error;
        if (isEditMode && selectedJemaat) {
          console.log('Updating jemaat with ID:', selectedJemaat.id);
          const { error: updateError } = await supabase
            .from('jemaat')
            .update(jemaatData)
            .eq('id', selectedJemaat.id);
          error = updateError;

          if (updateError) {
            console.error('Update error:', updateError);
          } else {
            console.log('Update successful');
          }
        } else {
          const { error: insertError } = await supabase
            .from('jemaat')
            .insert([jemaatData]);
          error = insertError;
        }

        if (error) {
          console.error('Database operation error:', error);
          throw error;
        }

        // Refresh data dan tutup modal
        await fetchJemaat();
        handleClose();
        alert(`Data jemaat berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      } catch (error) {
        console.error('Error:', error);
        alert(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} data jemaat. Silakan coba lagi.`);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Fungsi untuk menutup modal dan reset state
    const handleClose = () => {
      onClose();
      setIsEditMode(false);
      setSelectedJemaat(null);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
        <div className="relative z-50 w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            {isEditMode ? 'Edit Data Jemaat' : 'Tambah Data Jemaat'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload - Full Width */}
            <div className="flex flex-col items-center mb-4">
              <div
                className="relative w-32 h-32 mb-2 bg-gray-100 rounded-lg cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="object-cover w-full h-full rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <span>Pilih Foto</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Nama Lengkap - Full Width */}
            <div>
              <label className="block mb-1 text-sm text-gray-700">
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender - Radio Buttons - Full Width */}
            <div>
              <label className="block mb-2 text-sm text-gray-700">
                Jenis Kelamin *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="Laki-laki"
                    checked={formData.gender === 'Laki-laki'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-700">Laki-laki</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="Perempuan"
                    checked={formData.gender === 'Perempuan'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Perempuan</span>
                </label>
              </div>
            </div>

            {/* Two Columns for Phone and Birthday */}
            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block mb-1 text-sm text-gray-700">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block mb-1 text-sm text-gray-700">
                  Tanggal Lahir
                </label>
                <input
                  type="text"
                  name="birthday"
                  placeholder="DD-MM-YYYY"
                  value={formData.birthday}
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitizedValue = value.replace(/[^\d-]/g, '');
                    let formattedValue = sanitizedValue;
                    if (sanitizedValue.length >= 2 && !sanitizedValue.includes('-')) {
                      formattedValue = `${sanitizedValue.slice(0, 2)}-${sanitizedValue.slice(2)}`;
                    }
                    if (sanitizedValue.length >= 5 && formattedValue.split('-').length === 2) {
                      formattedValue = `${formattedValue.slice(0, 5)}-${formattedValue.slice(5)}`;
                    }
                    if (formattedValue.length <= 10) {
                      setFormData(prev => ({
                        ...prev,
                        birthday: formattedValue
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">Format: DD-MM-YYYY</span>
              </div>
            </div>

            {/* Alamat - Full Width */}
            <div>
              <label className="block mb-1 text-sm text-gray-700">
                Alamat
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Update tombol */}
            <div className="flex justify-end pt-4 space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="opacity-0">
                      {isEditMode ? 'Simpan' : 'Tambah'}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  </>
                ) : (
                  isEditMode ? 'Simpan' : 'Tambah'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modifikasi komponen DeleteConfirmationModal
  const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    jemaatName
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    jemaatName: string;
  }) => {
    const [isDeleting, setIsDeleting] = useState(false); // Tambahkan state untuk loading

    // Tambahkan fungsi handleDelete
    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await onConfirm();
      } finally {
        setIsDeleting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/50"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative z-50 w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>

          <h3 className="mb-2 text-lg font-medium text-center text-gray-900">
            Konfirmasi Penghapusan
          </h3>

          <p className="mb-6 text-center text-gray-500">
            Apakah Anda yakin ingin menghapus data jemaat <span className="font-semibold text-gray-700">{jemaatName}</span>?
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="relative px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <span className="opacity-0">Hapus</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  </div>
                </>
              ) : (
                'Hapus'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const sanitizeFileName = (fileName: string): string => {
    // Hapus karakter khusus dan spasi
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '')
      .replace(/\s+/g, '-');
  };

  // Tambahkan fungsi untuk menghitung ulang tahun terdekat
  // const calculateBirthdayNotifications = async () => {
  //   const currentDate = new Date();
  //   const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed
  //   const currentYear = currentDate.getFullYear();

  //   // Calculate the start and end dates for the current month
  // const startDate = new Date(currentYear, currentMonth - 1, 1);
  // const endDate = new Date(currentYear, currentMonth, 1);

  //   try {
  //     const { data: allJemaat, error } = await supabase
  //     .rpc('get_upcoming_birthdays', {
  //       current_month: currentMonth,
  //       current_day: currentDate.getDate()
  //     });

  //     if (error) {
  //       console.error('Error fetching all jemaat data:', error);
  //       return;
  //     }

  //     const today = new Date();
  //     const nextWeek = new Date(today);
  //     nextWeek.setDate(today.getDate() + 7);
  //     const previousWeek = new Date(today);
  //     previousWeek.setDate(today.getDate() - 7);

  //     const notifications = allJemaat.filter(jemaat => {
  //       if (jemaat.birthday) {
  //         const birthday = new Date(jemaat.birthday);
  //         birthday.setFullYear(today.getFullYear()); // Set tahun ke tahun ini
  //         return birthday >= previousWeek && birthday <= nextWeek;
  //       }
  //       return false;
  //     });

  //     setBirthdayNotifications(notifications);
  //   } catch (error) {
  //     console.error('Error calculating birthday notifications:', error);
  //   }
  // };

  const calculateBirthdayNotifications = async () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Months are zero-indexed
    const currentYear = today.getFullYear();

    try {
      const { data: allJemaat, error } = await supabase
        .rpc('get_upcoming_birthdays', {
          current_month: currentMonth,
          current_day: today.getDate()
        });

      if (error) {
        console.error('Error fetching all jemaat data:', error);
        return;
      }

      console.log('All jemaat data:', allJemaat);

      // const startDate = new Date(today);
      // startDate.setDate(today.getDate() - 7);
      // const endDate = new Date(today);
      // endDate.setDate(today.getDate() + 7);

      // const notifications = allJemaat.filter(jemaat => {
      //   if (jemaat.birthday) {
      //     const birthday = new Date(jemaat.birthday);
      //     birthday.setFullYear(currentYear); // Set the year to the current year
      //     return birthday >= startDate && birthday <= endDate;
      //   }
      //   return false;
      // })
      // .sort((a, b) => {
      //   const birthdayA = new Date(a.birthday);
      //   const birthdayB = new Date(b.birthday);
      //   return birthdayA > birthdayB;
      // });

      setBirthdayNotifications(allJemaat);
    } catch (error) {
      console.error('Error calculating birthday notifications:', error);
    }
  };

  // Panggil fungsi ini setelah jemaatList diperbarui
  useEffect(() => {
    calculateBirthdayNotifications();
  }, [jemaatList]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">Daftar Jemaat</h1>
          <div className="flex items-center space-x-4">
            {userName && (
              <span className="text-gray-800">{userName}</span>
            )}
            <button
              className="relative p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setIsNotificationModalOpen(true)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                {birthdayNotifications.length}
              </span>
            </button>
            <button
              onClick={() => signOut()}
              className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama atau nomor telepon..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <button
                onClick={handleSearchClick}
                className="absolute top-0 right-0 h-full px-4 text-white bg-blue-500 rounded-r-md hover:bg-blue-600"
              >
                Search
              </button>
            </div>

            {userRole === 1 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
              >
                <span className="text-xl">+</span> Tambah Data
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : jemaatList.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-lg shadow">
            <p className="text-gray-500">No jemaat records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jemaatList.map((jemaat) => (
              <div key={jemaat.id} className="relative overflow-hidden bg-white rounded-lg shadow">
                <div className="absolute flex space-x-2 top-2 right-2">
                  {userRole === 1 && (
                    <>
                      <button
                        onClick={() => handleEditClick(jemaat)}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
                        title="Edit Jemaat"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(jemaat.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                        title="Hapus Jemaat"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="px-4 py-3">
                  <div className="flex items-center space-x-4">
                    {jemaat.photo ? (
                      <img
                        src={String(jemaat.photo)}
                        alt={jemaat.full_name}
                        className="object-cover w-32 h-32 rounded-[5px] cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(String(jemaat.photo))}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
                        <span className="text-2xl text-gray-500">
                          {jemaat.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{jemaat.full_name}</h3>
                      <span><p className="text-sm">
                        Tgl daftar {formatDate(jemaat.created_at)}
                      </p></span>
                      <p className="text-gray-700">{jemaat.gender || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-700">{jemaat.phone || 'N/A'}</p>
                      </div>

                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-sm text-gray-500">Tgl. Lahir</p>
                        <p className="text-gray-700">{formatDate(jemaat.birthday)}</p>
                      </div>
                      <div className="mr-8 text-left">
                        <p className="text-sm text-gray-500">Umur</p>
                        <p className="text-gray-700">{jemaat.age || 'N/A'}</p>
                      </div>
                    </div>
                  </div>



                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-gray-700">
                        {jemaat.is_new ? 'Baru' : 'Lama'} • {jemaat.is_baptis ? 'Sudah Baptis' : 'Belum Baptis'} • {jemaat.marital_status || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Alamat</p>
                      <p className="text-gray-700">{jemaat.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
        }

        {/* Kontrol Pagination */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || totalCount === 0}
            className="px-4 py-2 text-white bg-blue-500 rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span className="text-gray-700">
            {totalCount === 0 ? 'Tidak ada data' : `Halaman ${currentPage} dari ${totalPages}`}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalCount === 0}
            className="px-4 py-2 text-white bg-blue-500 rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </main >

      {/* Tambahkan Modal */}
      {/* Add ImageModal before other modals */}
      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage || ''}
        onClose={() => setSelectedImage(null)}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedJemaatId(null);
        }}
        onConfirm={handleDeleteConfirm}
        jemaatName={jemaatList.find(j => j.id === selectedJemaatId)?.full_name || ''}
      />

      <AddJemaatModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Tambahkan Modal untuk Menampilkan Detail Notifikasi */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={birthdayNotifications}
        formatDate={formatDate}
      />
    </div >
  );
}

// Tambahkan NotificationModal
const NotificationModal = ({ isOpen, onClose, notifications, formatDate }: { isOpen: boolean; onClose: () => void; notifications: Jemaat[]; formatDate: (dateString: string | null) => string; }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 backdrop-blur-sm bg-black/70" onClick={onClose}></div>
      <div className="relative z-50 w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Notifikasi Ulang Tahun</h3>
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500">Tidak ada ulang tahun dalam waktu dekat.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map(jemaat => (
                <li key={jemaat.id} className="flex items-center p-4 border rounded-md">
                  {jemaat.photo && (
                    <img
                      src={String(jemaat.photo)}
                      alt={jemaat.full_name}
                      className="w-16 h-16 mr-3 rounded-none"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{jemaat.full_name}</p>
                    <p>Tanggal Lahir: {formatDate(jemaat.birthday)}</p>
                    <p>Nomor Telepon: {jemaat.phone || 'N/A'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={onClose} className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-md hover:bg-blue-600">
          Tutup
        </button>
      </div>
    </div>
  );
};
