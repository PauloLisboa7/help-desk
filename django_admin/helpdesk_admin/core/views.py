from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def dashboard(request):
    """Dashboard simples para o admin"""
    from .models import Chamado, Usuario, Equipamento
    
    context = {
        'chamados_abertos': Chamado.objects.filter(status='aberto').count(),
        'chamados_em_atendimento': Chamado.objects.filter(status='em_atendimento').count(),
        'usuarios_ativos': Usuario.objects.filter(ativo=True).count(),
        'equipamentos_manutencao': Equipamento.objects.filter(status='manutencao').count(),
    }
    
    return render(request, 'core/dashboard.html', context)
