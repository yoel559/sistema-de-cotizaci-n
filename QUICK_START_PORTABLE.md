# 🚀 Inicio Rápido - Sistema Portable

## Para crear el sistema portable (una sola vez):

```bash
# 1. Build del frontend
cd frontend
npm run build
cd ..

# 2. Preparar sistema portable
python scripts/prepare_portable.py

# 3. Copiar modelos de Ollama
python scripts/download_model.py

# 4. Verificar que todo esté listo
python scripts/check_portable.py
```

## Para usar desde USB:

1. **Copia la carpeta `portable_build` a tu USB**

2. **En cualquier PC:**
   - Windows: Doble clic en `start.bat`
   - Linux/Mac: Ejecuta `./start.sh`

3. **Accede al sistema:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## ⚠️ Requisitos en el PC destino:

- Python 3.8+ instalado
- Ollama instalado (para el chatbot)

## 📦 Lo que incluye el USB:

- ✅ Todo el código del backend
- ✅ Build completo del frontend
- ✅ Entorno virtual de Python con dependencias
- ✅ Modelos de IA (si los copias)
- ✅ Base de datos SQLite (portable)
- ✅ Scripts de inicio automático

## 💡 Ventajas:

- No necesitas instalar nada en cada PC
- Todos los datos se guardan en el USB
- Funciona en cualquier PC con Python
- Fácil de actualizar

---

**Documentación completa:** Ver `PORTABLE_SETUP.md`
















