import logging
from typing import Any, Dict, Optional
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


def format_currency(amount: float, currency: str = "USD") -> str:
    """Formatear moneda"""
    if currency == "USD":
        return f"${amount:,.2f}"
    elif currency == "EUR":
        return f"€{amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"


def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Formatear fecha y hora"""
    return dt.strftime(format_str)


def calculate_days_until_expiry(expiry_date: datetime) -> int:
    """Calcular días hasta la expiración"""
    now = datetime.utcnow()
    delta = expiry_date - now
    return delta.days


def is_expired(expiry_date: datetime) -> bool:
    """Verificar si una fecha ha expirado"""
    return datetime.utcnow() > expiry_date


def generate_quotation_number(prefix: str = "QT", date_format: str = "%Y%m%d") -> str:
    """Generar número de cotización único"""
    import uuid
    date_part = datetime.now().strftime(date_format)
    unique_part = str(uuid.uuid4())[:8].upper()
    return f"{prefix}-{date_part}-{unique_part}"


def validate_email(email: str) -> bool:
    """Validar formato de email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone: str) -> bool:
    """Validar formato de teléfono"""
    import re
    # Patrón básico para teléfonos internacionales
    pattern = r'^\+?[1-9]\d{1,14}$'
    return re.match(pattern, phone) is not None


def safe_json_dumps(obj: Any) -> str:
    """Serializar objeto a JSON de forma segura"""
    try:
        return json.dumps(obj, default=str)
    except Exception as e:
        logger.error(f"Error serializando objeto a JSON: {e}")
        return "{}"


def safe_json_loads(json_str: str) -> Optional[Dict]:
    """Deserializar JSON de forma segura"""
    try:
        return json.loads(json_str)
    except Exception as e:
        logger.error(f"Error deserializando JSON: {e}")
        return None


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncar texto a una longitud máxima"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def calculate_percentage(part: float, total: float) -> float:
    """Calcular porcentaje"""
    if total == 0:
        return 0.0
    return (part / total) * 100


def format_file_size(size_bytes: int) -> str:
    """Formatear tamaño de archivo"""
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f}{size_names[i]}"


def get_client_ip(request) -> str:
    """Obtener IP del cliente"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host


def sanitize_filename(filename: str) -> str:
    """Sanitizar nombre de archivo"""
    import re
    # Remover caracteres no permitidos
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limitar longitud
    if len(sanitized) > 255:
        name, ext = sanitized.rsplit('.', 1)
        sanitized = name[:255-len(ext)-1] + '.' + ext
    return sanitized


def create_slug(text: str) -> str:
    """Crear slug a partir de texto"""
    import re
    import unicodedata
    
    # Normalizar caracteres Unicode
    text = unicodedata.normalize('NFKD', text)
    
    # Convertir a minúsculas y reemplazar espacios con guiones
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    text = re.sub(r'[-\s]+', '-', text)
    
    return text


def mask_sensitive_data(data: str, mask_char: str = "*") -> str:
    """Enmascarar datos sensibles"""
    if len(data) <= 4:
        return mask_char * len(data)
    
    return data[:2] + mask_char * (len(data) - 4) + data[-2:]


def is_business_hours() -> bool:
    """Verificar si es horario de trabajo (9 AM - 6 PM, Lunes-Viernes)"""
    now = datetime.now()
    
    # Verificar si es fin de semana
    if now.weekday() >= 5:  # Sábado = 5, Domingo = 6
        return False
    
    # Verificar horario
    start_time = now.replace(hour=9, minute=0, second=0, microsecond=0)
    end_time = now.replace(hour=18, minute=0, second=0, microsecond=0)
    
    return start_time <= now <= end_time
