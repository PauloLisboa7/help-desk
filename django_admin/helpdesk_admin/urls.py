"""
URL configuration for helpdesk_admin project.
"""
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
]

admin.site.site_header = "Help Desk Corporativo - Administração"
admin.site.site_title = "Admin Help Desk"
admin.site.index_title = "Bem-vindo ao Painel de Administração"
