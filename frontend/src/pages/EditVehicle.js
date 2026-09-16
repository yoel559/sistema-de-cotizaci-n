import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { 
  FiArrowLeft,
  FiTruck,
  FiDollarSign,
  FiSave,
  FiX,
  FiImage,
  FiTrash2,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const vehicleId = id ? parseInt(id) : null;

  const [formData, setFormData] = useState({
    marca: '',
    model: '',
    color: '',
    available: true,
    precio: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  // Fetch vehicle details
  const { data: vehicle, isLoading: loadingVehicle } = useQuery(
    ['vehicle', vehicleId],
    () => inventoryAPI.getVehicleById(vehicleId),
    {
      enabled: !!vehicleId,
      select: (response) => response?.data || response,
      onError: (err) => {
        console.error('Error cargando vehículo:', err);
        toast.error('Error al cargar el vehículo');
      }
    }
  );

  // Cargar datos del vehículo cuando se obtiene
  useEffect(() => {
    if (vehicle) {
      setFormData({
        marca: vehicle.marca || '',
        model: vehicle.model || '',
        color: vehicle.color || '',
        available: vehicle.available !== undefined ? vehicle.available : true,
        precio: vehicle.precio ? vehicle.precio.toString() : ''
      });
      
      // Si hay imagen actual, mostrarla
      if (vehicle.image_url) {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        setCurrentImageUrl(vehicle.image_url.startsWith('http') 
          ? vehicle.image_url 
          : `${apiBaseUrl}${vehicle.image_url}`);
      }
    }
  }, [vehicle]);

  // Update vehicle mutation
  const updateVehicleMutation = useMutation(
    (vehicleData) => inventoryAPI.updateVehicle(vehicleId, vehicleData),
    {
      onSuccess: () => {
        toast.success('Vehículo actualizado exitosamente');
        queryClient.invalidateQueries('vehicles');
        queryClient.invalidateQueries(['vehicle', vehicleId]);
        navigate(`/inventory/${vehicleId}`);
      },
      onError: (error) => {
        let errorMessage = 'Error al actualizar el vehículo';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map(err => {
                if (typeof err === 'string') return err;
                if (err.msg) return err.msg;
                return JSON.stringify(err);
              })
              .join(', ');
          } else if (typeof errorData.detail === 'object') {
            errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Error al actualizar vehículo:', error);
        toast.error(errorMessage);
      }
    }
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. El tamaño máximo es 5MB');
        return;
      }
      
      setSelectedImage(file);
      setCurrentImageUrl(null); // Ocultar imagen actual si se selecciona una nueva
      
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
    setCurrentImageUrl(null);
    const fileInput = document.getElementById('vehicle-image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.marca || !formData.model) {
      toast.error('Por favor completa los campos requeridos (Marca y Modelo)');
      return;
    }

    // Crear FormData para enviar datos y archivo
    const formDataToSend = new FormData();
    formDataToSend.append('marca', formData.marca.trim());
    formDataToSend.append('model', formData.model.trim());
    
    if (formData.color) {
      formDataToSend.append('color', formData.color.trim());
    }
    
    formDataToSend.append('available', formData.available ? 'true' : 'false');
    
    if (formData.precio && formData.precio.trim()) {
      formDataToSend.append('precio', formData.precio.trim());
    }
    
    // Agregar imagen si se seleccionó una nueva
    if (selectedImage) {
      formDataToSend.append('image', selectedImage);
    }

    updateVehicleMutation.mutate(formDataToSend);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loadingVehicle) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
        </div>
        <div className="alert alert-error">
          <FiXCircle className="w-5 h-5" />
          <span>Vehículo no encontrado</span>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-base-content">Editar Vehículo</h1>
            <p className="text-base-content/60 mt-1">
              Actualiza la información del vehículo
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del VIN (solo lectura) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <FiTruck className="w-4 h-4 inline mr-2" />
                  VIN (No editable)
                </span>
              </label>
              <input
                type="text"
                value={vehicle.vin || ''}
                className="input input-bordered w-full bg-base-200"
                disabled
                readOnly
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  El VIN no puede ser modificado
                </span>
              </label>
            </div>

            {/* Marca y Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <span className="label-text font-medium">Estado</span>
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
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    {formData.available ? (
                      <span className="flex items-center gap-1 text-success">
                        <FiCheckCircle className="w-3 h-3" />
                        Vehículo disponible para venta
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-error">
                        <FiXCircle className="w-3 h-3" />
                        Vehículo no disponible
                      </span>
                    )}
                  </span>
                </label>
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
                  Formatos permitidos: JPG, PNG, GIF, WEBP (máximo 5MB). Deja vacío para mantener la imagen actual.
                </span>
              </label>
              
              {/* Vista previa de la imagen */}
              {(imagePreview || currentImageUrl) && (
                <div className="mt-4 relative">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || currentImageUrl}
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
                disabled={updateVehicleMutation.isLoading}
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateVehicleMutation.isLoading}
              >
                {updateVehicleMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Guardar Cambios
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

export default EditVehicle;

