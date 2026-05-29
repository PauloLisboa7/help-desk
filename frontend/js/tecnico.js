document.addEventListener('DOMContentLoaded', async () => {
  const user = authManager.getUser();
  const alertArea = document.getElementById('alertArea');
  if (!user) return window.location.href = '/';

  try {
    const resp = await authManager.fetch('/chamados');
    if (!resp.ok) throw new Error('Erro ao buscar chamados');
    const chamados = await resp.json();

    const tbody = document.querySelector('#tecnicoChamadosTable tbody');
    tbody.innerHTML = '';
    chamados.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.numero_chamado || c.id}</td>
        <td>${escapeHtml(c.titulo)}</td>
        <td>${String(c.status).replace(/_/g,' ')}</td>
        <td>${escapeHtml(c.usuario_nome || '')}</td>
        <td>${formatDate(c.criado_em)}</td>
        <td>
          <button class="btn btn-sm btn-success atribuirBtn">Atribuir a mim</button>
        </td>
      `;
      const btn = tr.querySelector('.atribuirBtn');
      btn.addEventListener('click', async () => {
        try {
          const res = await authManager.fetch(`/chamados/${c.id}/assign`, {
            method: 'PATCH',
            body: JSON.stringify({ tecnico_id: user.id })
          });
          if (!res.ok) throw new Error('Falha ao atribuir');
          showAlert(alertArea, 'Chamado atribuído a você', 'success');
          btn.disabled = true;
          btn.textContent = 'Atribuído';
        } catch (err) {
          showAlert(alertArea, 'Erro ao atribuir chamado', 'danger');
        }
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    showAlert(alertArea, 'Erro ao carregar chamados', 'danger');
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} )[s];
  });
}