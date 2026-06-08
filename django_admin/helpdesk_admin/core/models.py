from django.db import models
from django.utils import timezone


class Usuario(models.Model):
    PERFIL_CHOICES = [
        ('administrador', 'Administrador'),
        ('tecnico', 'Técnico'),
        ('usuario', 'Usuário'),
        ('n1', 'Suporte N1'),
        ('n2', 'Suporte N2'),
        ('n3', 'Suporte N3'),
    ]

    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=255)
    perfil = models.CharField(max_length=50, choices=PERFIL_CHOICES, default='usuario')
    departamento = models.CharField(max_length=100, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    patrimonio = models.CharField(max_length=100, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'usuarios'
        managed = False
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return f"{self.nome} ({self.get_perfil_display()})"


class Categoria(models.Model):
    NIVEL_CHOICES = [
        ('n1', 'N1'),
        ('n2', 'N2'),
        ('n3', 'N3'),
    ]

    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True, null=True)
    nivel_suporte = models.CharField(max_length=10, choices=NIVEL_CHOICES, default='n2')
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categorias'
        managed = False
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'

    def __str__(self):
        return self.nome


class Chamado(models.Model):
    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('media', 'Média'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]

    STATUS_CHOICES = [
        ('aberto', 'Aberto'),
        ('em_atendimento', 'Em Atendimento'),
        ('resolvido', 'Resolvido'),
        ('fechado', 'Fechado'),
    ]

    id = models.AutoField(primary_key=True)
    numero_chamado = models.CharField(max_length=20, unique=True)
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    usuario = models.ForeignKey(Usuario, on_delete=models.RESTRICT, related_name='chamados_criados')
    tecnico = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='chamados_atribuidos')
    categoria = models.ForeignKey(Categoria, on_delete=models.RESTRICT)
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES, default='media')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='aberto')
    sla_horas = models.IntegerField(blank=True, null=True)
    data_vencimento = models.DateTimeField(blank=True, null=True)
    data_resolucao = models.DateTimeField(blank=True, null=True)
    patrimonio_maquina = models.CharField(max_length=100, blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chamados'
        managed = False
        verbose_name = 'Chamado'
        verbose_name_plural = 'Chamados'
        ordering = ['-criado_em']

    def __str__(self):
        return f"{self.numero_chamado} - {self.titulo}"


class AtualizacaoChamado(models.Model):
    TIPO_CHOICES = [
        ('comentario', 'Comentário'),
        ('status', 'Mudança de Status'),
        ('atribuicao', 'Atribuição'),
        ('resolucao', 'Resolução'),
    ]

    id = models.AutoField(primary_key=True)
    chamado = models.ForeignKey(Chamado, on_delete=models.CASCADE, related_name='atualizacoes')
    usuario = models.ForeignKey(Usuario, on_delete=models.RESTRICT)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES, default='comentario')
    descricao = models.TextField(blank=True, null=True)
    dados_anteriores = models.JSONField(blank=True, null=True)
    dados_novos = models.JSONField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'atualizacoes_chamados'
        managed = False
        verbose_name = 'Atualização de Chamado'
        verbose_name_plural = 'Atualizações de Chamados'
        ordering = ['-criado_em']

    def __str__(self):
        return f"{self.chamado.numero_chamado} - {self.get_tipo_display()}"


class Anexo(models.Model):
    id = models.AutoField(primary_key=True)
    chamado = models.ForeignKey(Chamado, on_delete=models.CASCADE, related_name='anexos')
    nome_arquivo = models.CharField(max_length=255)
    caminho_arquivo = models.CharField(max_length=255)
    tipo_mime = models.CharField(max_length=50, blank=True, null=True)
    tamanho = models.IntegerField(blank=True, null=True)
    enviado_por = models.ForeignKey(Usuario, on_delete=models.RESTRICT)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'anexos'
        managed = False
        verbose_name = 'Anexo'
        verbose_name_plural = 'Anexos'

    def __str__(self):
        return self.nome_arquivo


class Equipamento(models.Model):
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('inativo', 'Inativo'),
        ('manutencao', 'Em Manutenção'),
        ('descartado', 'Descartado'),
    ]

    id = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=50)
    modelo = models.CharField(max_length=100)
    serie = models.CharField(max_length=100, unique=True, blank=True, null=True)
    patrimonio = models.CharField(max_length=100, blank=True, null=True)
    localizacao = models.CharField(max_length=100, blank=True, null=True)
    responsavel = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipamentos_responsavel')
    cadastrado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipamentos_cadastrados')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='ativo')
    data_aquisicao = models.DateField(blank=True, null=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equipamentos'
        managed = False
        verbose_name = 'Equipamento'
        verbose_name_plural = 'Equipamentos'

    def __str__(self):
        return f"{self.tipo} - {self.modelo} ({self.patrimonio or self.serie})"


class LogAuditoria(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    acao = models.CharField(max_length=100)
    tabela = models.CharField(max_length=50, blank=True, null=True)
    registro_id = models.IntegerField(blank=True, null=True)
    dados_anteriores = models.JSONField(blank=True, null=True)
    dados_novos = models.JSONField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'logs_auditoria'
        managed = False
        verbose_name = 'Log de Auditoria'
        verbose_name_plural = 'Logs de Auditoria'
        ordering = ['-criado_em']

    def __str__(self):
        return f"{self.acao} - {self.usuario} - {self.criado_em}"
