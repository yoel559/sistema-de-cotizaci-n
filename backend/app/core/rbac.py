from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from ..models.user import User
from .security import get_current_active_user


ALLOWED_ROLES = {
    "admin": 3,
    "gerente": 3,
    "jefe": 2,
    "empleado": 1,
}


def require_roles(*roles: str):
    def _checker(current_user: User = Depends(get_current_active_user)):
        # This is a placeholder; endpoints should pass get_current_active_user
        role_level = ALLOWED_ROLES.get(getattr(current_user, "rol", "empleado"), 1)
        for role in roles:
            if role in ALLOWED_ROLES and role_level >= ALLOWED_ROLES[role]:
                return current_user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

    return _checker


def is_manager_or_above(user: User) -> bool:
    return ALLOWED_ROLES.get(user.rol, 1) >= ALLOWED_ROLES["jefe"]


def is_admin(user: User) -> bool:
    return ALLOWED_ROLES.get(user.rol, 1) >= ALLOWED_ROLES["gerente"]


def get_visible_user_ids(db: Session, current_user: User) -> List[int]:
    """Return the list of user IDs whose data current_user can see.
    - empleado: solo propio
    - jefe: él + reportes directos (y recursivos)
    - gerente/admin: todos
    """
    if is_admin(current_user):
        return [uid for (uid,) in db.query(User.id_usuario).all()]  # type: ignore

    if not is_manager_or_above(current_user):
        return [current_user.id_usuario]

    # BFS para obtener reportes recursivos
    visible = {current_user.id_usuario}
    frontier = [current_user.id_usuario]
    while frontier:
        next_frontier: List[int] = []
        for manager_id in frontier:
            rows = db.query(User.id_usuario).filter(User.manager_id == manager_id).all()
            for (uid,) in rows:
                if uid not in visible:
                    visible.add(uid)
                    next_frontier.append(uid)
        frontier = next_frontier
    return list(visible)


def get_role_level(user: User) -> int:
    return ALLOWED_ROLES.get(user.rol, 1)


