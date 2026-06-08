import bcrypt
from django.contrib.auth import get_user_model

from .models import Usuario


class UsuarioBackend:
    """Autentica usuários usando a tabela `usuarios` do sistema (campo `senha` com hash bcrypt).

    Mapeia o `Usuario.email` para o `User.username` do Django (cria o `User` local se necessário).
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None

        # Tentar localizar por email ou nome
        try:
            usuario = Usuario.objects.get(email__iexact=username)
        except Usuario.DoesNotExist:
            try:
                usuario = Usuario.objects.get(nome__iexact=username)
            except Usuario.DoesNotExist:
                return None

        if not usuario.ativo:
            return None

        # senha armazenada como hash bcrypt (string utf-8)
        stored = usuario.senha
        if isinstance(stored, str):
            stored = stored.encode('utf-8')
        if isinstance(password, str):
            password_bytes = password.encode('utf-8')
        else:
            password_bytes = password

        try:
            ok = bcrypt.checkpw(password_bytes, stored)
        except Exception:
            ok = False

        if not ok:
            return None

        # Obter/Cria o Django User correspondente (username = email)
        User = get_user_model()
        username_field = usuario.email
        user, created = User.objects.get_or_create(username=username_field, defaults={
            'email': usuario.email,
            'is_staff': usuario.perfil in ('administrador', 'tecnico'),
            'is_superuser': usuario.perfil == 'administrador',
        })

        # Atualizar flags caso necessário
        changed = False
        if user.email != usuario.email:
            user.email = usuario.email
            changed = True
        is_staff = usuario.perfil in ('administrador', 'tecnico')
        if user.is_staff != is_staff:
            user.is_staff = is_staff
            changed = True
        is_super = usuario.perfil == 'administrador'
        if user.is_superuser != is_super:
            user.is_superuser = is_super
            changed = True
        if changed:
            user.save()

        return user

    def get_user(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
