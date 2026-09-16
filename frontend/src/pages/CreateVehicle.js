import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { 
  FiArrowLeft,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiSave,
  FiX,
  FiImage,
  FiTrash2
} from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateVehicle = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vin: '', // VIN (Vehicle Identification Number) - requerido
    marca: '', // Marca - requerido
    model: '', // Modelo - requerido
    color: '', // Color - opcional
    available: true, // Disponible - opcional, default true
    precio: '' // Precio - opcional
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Create vehicle mutation
  const createVehicleMutation = useMutation(
    (vehicleData) => inventoryAPI.createVehicle(vehicleData),
    {
      onSuccess: () => {
        toast.success('Vehículo creado exitosamente');
        queryClient.invalidateQueries('vehicles');
        navigate('/inventory');
      },
      onError: (error) => {
        // Mejorar el manejo de errores para mostrar mensajes más claros
        let errorMessage = 'Error al crear el vehículo';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          // Si detail es un string, usarlo directamente
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
          // Si detail es un array, unir los mensajes
          else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map(err => {
                if (typeof err === 'string') return err;
                if (err.msg) return err.msg;
                return JSON.stringify(err);
              })
              .join(', ');
          }
          // Si detail es un objeto, intentar extraer el mensaje
          else if (typeof errorData.detail === 'object') {
            errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
          }
          // Si hay un mensaje general
          else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Error al crear vehículo:', error);
        toast.error(errorMessage);
      }
    }
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. El tamaño máximo es 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Resetear el input de archivo
    const fileInput = document.getElementById('vehicle-image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vin || !formData.marca || !formData.model) {
      toast.error('Por favor completa los campos requeridos (VIN, Marca y Modelo)');
      return;
    }

    // Crear FormData para enviar datos y archivo
    const formDataToSend = new FormData();
    formDataToSend.append('vin', formData.vin.trim().toUpperCase());
    formDataToSend.append('marca', formData.marca.trim());
    formDataToSend.append('model', formData.model.trim());
    if (formData.color) {
      formDataToSend.append('color', formData.color.trim());
    }
    formDataToSend.append('available', formData.available ? 'true' : 'false');
    if (formData.precio && formData.precio.trim()) {
      formDataToSend.append('precio', formData.precio.trim());
    }
    
    // Agregar imagen si existe
    if (selectedImage) {
      formDataToSend.append('image', selectedImage);
    }

    createVehicleMutation.mutate(formDataToSend);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-base-content">Agregar Nuevo Vehículo</h1>
            <p className="text-base-content/60 mt-1">
              Registra un nuevo vehículo en el inventario
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* VIN, Marca y Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <FiTruck className="w-4 h-4 inline mr-2" />
                    VIN (Número de Identificación del Vehículo) *
                  </span>
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Ej: 1HGBH41JXMN109186"
                  required
                  maxLength={50}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    El VIN debe ser único para cada vehículo
                  </span>
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <FiTruck className="w-4 h-4 inline mr-2" />
                    Marca *
                  </span>
                </label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Ej: Toyota"
                  required
                  maxLength={50}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <FiTruck className="w-4 h-4 inline mr-2" />
                    Modelo *
                  </span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Ej: Corolla 2025"
                  required
                  maxLength={100}
                />
              </div>
            </div>

            {/* Color, Precio y Disponibilidad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Color</span>
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Blanco, Negro, Azul, etc."
                  maxLength={50}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <FiDollarSign className="w-4 h-4 inline mr-2" />
                    Precio
                  </span>
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Precio del vehículo en moneda local
                  </span>
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Disponibilidad</span>
                </label>
                <select
                  name="available"
                  value={formData.available ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.value === 'true' }))}
                  className="select select-bordered w-full"
                >
                  <option value="true">Disponible</option>
                  <option value="false">No Disponible</option>
                </select>
              </div>
            </div>

            {/* Imagen del Vehículo */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <FiImage className="w-4 h-4 inline mr-2" />
                  Imagen del Vehículo
                </span>
              </label>
              <input
                id="vehicle-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="file-input file-input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Formatos permitidos: JPG, PNG, GIF, WEBP (máximo 5MB)
                </span>
              </label>
              
              {/* Vista previa de la imagen */}
              {imagePreview && (
                <div className="mt-4 relative">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="max-w-full h-64 object-cover rounded-lg border-2 border-base-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 btn btn-sm btn-error btn-circle"
                      title="Eliminar imagen"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                disabled={createVehicleMutation.isLoading}
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createVehicleMutation.isLoading}
              >
                {createVehicleMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Agregar Vehículo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVehicle;
