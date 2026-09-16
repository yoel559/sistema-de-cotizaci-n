from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.quotation import Quotation
from typing import Optional


class QuotationNumberService:
    """Servicio para generar números de cotización automáticamente"""
    
    @staticmethod
    def generate_quotation_number(db: Session) -> str:
        """
        Genera un número de cotización único en formato: Cotización Nro. 000000001
        
        Args:
            db: Sesión de base de datos
            
        Returns:
            str: Número de cotización único
        """
        # Obtener el último número de cotización
        last_quotation = db.query(Quotation).order_by(Quotation.id_cotizacion.desc()).first()
        
        if last_quotation and last_quotation.numero_cotizacion:
            # Extraer el número del último formato
            try:
                # Buscar el patrón "Cotización Nro. XXXXXXXX"
                parts = last_quotation.numero_cotizacion.split("Nro. ")
                if len(parts) == 2:
                    last_number = int(parts[1].strip())
                    next_number = last_number + 1
                else:
                    # Si no sigue el formato esperado, empezar desde 1
                    next_number = 1
            except (ValueError, IndexError):
                # Si hay error al parsear, empezar desde 1
                next_number = 1
        else:
            # Si no hay cotizaciones previas, empezar desde 1
            next_number = 1
        
        # Formatear con ceros a la izquierda (9 dígitos)
        formatted_number = f"{next_number:09d}"
        
        return f"Cotización Nro. {formatted_number}"
    
    @staticmethod
    def validate_quotation_number(db: Session, quotation_number: str) -> bool:
        """
        Valida si un número de cotización ya existe
        
        Args:
            db: Sesión de base de datos
            quotation_number: Número de cotización a validar
            
        Returns:
            bool: True si el número es único, False si ya existe
        """
        existing = db.query(Quotation).filter(
            Quotation.numero_cotizacion == quotation_number
        ).first()
        
        return existing is None
    
    @staticmethod
    def get_next_available_number(db: Session) -> str:
        """
        Obtiene el siguiente número disponible sin crear la cotización
        
        Args:
            db: Sesión de base de datos
            
        Returns:
            str: Siguiente número de cotización disponible
        """
        return QuotationNumberService.generate_quotation_number(db)
    
    @staticmethod
    def parse_quotation_number(quotation_number: str) -> Optional[int]:
        """
        Extrae el número numérico de un número de cotización
        
        Args:
            quotation_number: Número de cotización en formato "Cotización Nro. XXXXXXXX"
            
        Returns:
            int: Número extraído o None si no se puede parsear
        """
        try:
            parts = quotation_number.split("Nro. ")
            if len(parts) == 2:
                return int(parts[1].strip())
        except (ValueError, IndexError):
            pass
        return None
