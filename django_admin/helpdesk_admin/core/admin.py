from django.contrib import admin
from django.utils.html import format_html
from .models import Usuario, Categoria, Chamado, AtualizacaoChamado, Anexo, Equipamento, LogAuditoria


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('nome', 'email', 'perfil_badge', 'departamento', 'ativo', 'criado_em')
    list_filter = ('perfil', 'ativo', 'criado_em')
    search_fields = ('nome', 'email', 'departamento')
    readonly_fields = ('criado_em', 'atualizado_em', 'last_active')
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'email', 'perfil', 'ativo')
        }),
        ('Contato e Departamento', {
            'fields': ('telefone', 'departamento', 'patrimonio')
        }),
        ('Auditoria', {
            'fields': ('criado_em', 'atualizado_em', 'last_active'),
            'classes': ('collapse',)
        }),
    )
    
    def perfil_badge(self, obj):
        colors = {
            'administrador': '#d63031',
            'tecnico': '#0984e3',
            'usuario': '#27ae60',
            'n1': '#f39c12',
            'n2': '#e67e22',
            'n3': '#c0392b',
        }
        color = colors.get(obj.perfil, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_perfil_display()
        )
    perfil_badge.short_description = 'Perfil'


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'nivel_suporte', 'ativo', 'criado_em')
    list_filter = ('nivel_suporte', 'ativo')
    search_fields = ('nome', 'descricao')
    readonly_fields = ('criado_em',)


@admin.register(Chamado)
class ChamadoAdmin(admin.ModelAdmin):
    list_display = ('numero_chamado', 'titulo_resumido', 'usuario_nome', 'tecnico_nome', 'prioridade_badge', 'status_badge', 'criado_em')
    list_filter = ('status', 'prioridade', 'categoria', 'criado_em')
    search_fields = ('numero_chamado', 'titulo', 'descricao')
    readonly_fields = ('criado_em', 'atualizado_em')
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_chamado', 'titulo', 'descricao')
        }),
        ('Atribuição', {
            'fields': ('usuario', 'tecnico', 'categoria')
        }),
        ('Prioridade e Status', {
            'fields': ('prioridade', 'status', 'sla_horas')
        }),
        ('Datas', {
            'fields': ('data_vencimento', 'data_resolucao', 'criado_em', 'atualizado_em')
        }),
        ('Equipamento', {
            'fields': ('patrimonio_maquina',)
        }),
    )
    
    def titulo_resumido(self, obj):
        return obj.titulo[:50] + '...' if len(obj.titulo) > 50 else obj.titulo
    titulo_resumido.short_description = 'Título'
    
    def usuario_nome(self, obj):
        return obj.usuario.nome if obj.usuario else '-'
    usuario_nome.short_description = 'Usuário'
    
    def tecnico_nome(self, obj):
        return obj.tecnico.nome if obj.tecnico else 'Não atribuído'
    tecnico_nome.short_description = 'Técnico'
    
    def prioridade_badge(self, obj):
        colors = {
            'baixa': '#27ae60',
            'media': '#f39c12',
            'alta': '#e67e22',
            'critica': '#c0392b',
        }
        color = colors.get(obj.prioridade, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_prioridade_display()
        )
    prioridade_badge.short_description = 'Prioridade'
    
    def status_badge(self, obj):
        colors = {
            'aberto': '#e74c3c',
            'em_atendimento': '#f39c12',
            'resolvido': '#27ae60',
            'fechado': '#95a5a6',
        }
        color = colors.get(obj.status, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(AtualizacaoChamado)
class AtualizacaoChamadoAdmin(admin.ModelAdmin):
    list_display = ('chamado', 'usuario_nome', 'tipo', 'criado_em')
    list_filter = ('tipo', 'criado_em')
    search_fields = ('chamado__numero_chamado', 'descricao')
    readonly_fields = ('criado_em', 'dados_anteriores', 'dados_novos')
    
    def usuario_nome(self, obj):
        return obj.usuario.nome
    usuario_nome.short_description = 'Usuário'


@admin.register(Anexo)
class AnexoAdmin(admin.ModelAdmin):
    list_display = ('nome_arquivo', 'chamado', 'enviado_por_nome', 'tamanho_kb', 'criado_em')
    list_filter = ('tipo_mime', 'criado_em')
    search_fields = ('nome_arquivo', 'chamado__numero_chamado')
    readonly_fields = ('criado_em',)
    
    def enviado_por_nome(self, obj):
        return obj.enviado_por.nome
    enviado_por_nome.short_description = 'Enviado por'
    
    def tamanho_kb(self, obj):
        if obj.tamanho:
            return f"{obj.tamanho / 1024:.1f} KB"
        return '-'
    tamanho_kb.short_description = 'Tamanho'


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ('patrimonio_ou_serie', 'tipo', 'modelo', 'responsavel_nome', 'status_badge', 'criado_em')
    list_filter = ('tipo', 'status', 'criado_em')
    search_fields = ('patrimonio', 'serie', 'modelo', 'tipo')
    readonly_fields = ('criado_em', 'atualizado_em')
    fieldsets = (
        ('Identificação', {
            'fields': ('tipo', 'modelo', 'serie', 'patrimonio')
        }),
        ('Responsabilidade', {
            'fields': ('responsavel', 'cadastrado_por')
        }),
        ('Status e Dados', {
            'fields': ('status', 'localizacao', 'data_aquisicao', 'valor')
        }),
        ('Auditoria', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        }),
    )
    
    def patrimonio_ou_serie(self, obj):
        return obj.patrimonio or obj.serie or 'N/A'
    patrimonio_ou_serie.short_description = 'Identificador'
    
    def responsavel_nome(self, obj):
        return obj.responsavel.nome if obj.responsavel else '-'
    responsavel_nome.short_description = 'Responsável'
    
    def status_badge(self, obj):
        colors = {
            'ativo': '#27ae60',
            'inativo': '#95a5a6',
            'manutencao': '#f39c12',
            'descartado': '#c0392b',
        }
        color = colors.get(obj.status, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('acao', 'usuario_nome', 'tabela', 'criado_em')
    list_filter = ('acao', 'tabela', 'criado_em')
    search_fields = ('acao', 'usuario__nome')
    readonly_fields = ('criado_em', 'dados_anteriores', 'dados_novos')
    
    def usuario_nome(self, obj):
        return obj.usuario.nome if obj.usuario else 'Sistema'
    usuario_nome.short_description = 'Usuário'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


# --- Integrar criação/atualização de `auth.User` com a tabela `usuarios` ---
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import User
import bcrypt


class CustomUserAdmin(DjangoUserAdmin):
    def save_model(self, request, obj, form, change):
        # Salva o usuário Django normalmente
        super().save_model(request, obj, form, change)

        # Tentar obter a senha em texto claro (apenas disponível no formulário de criação)
        raw_password = None
        try:
            raw_password = form.cleaned_data.get('password1')
        except Exception:
            raw_password = None

        # Se houver senha em texto, sincronizar com a tabela `usuarios`
        if raw_password:
            try:
                hashed = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            except Exception:
                hashed = None

            if hashed:
                # Criar ou atualizar registro na tabela `usuarios`
                try:
                    usuario_obj, created = Usuario.objects.get_or_create(
                        email=obj.email,
                        defaults={
                            'nome': obj.get_full_name() or obj.username,
                            'senha': hashed,
                            'perfil': 'usuario',
                            'ativo': True,
                        }
                    )
                    if not created:
                        usuario_obj.senha = hashed
                        usuario_obj.nome = obj.get_full_name() or obj.username
                        usuario_obj.ativo = True
                        usuario_obj.save()
                except Exception:
                    # não falhar o admin por conta dessa sincronização
                    pass


try:
    admin.site.unregister(User)
except Exception:
    pass

admin.site.register(User, CustomUserAdmin)
