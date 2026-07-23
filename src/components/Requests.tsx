import { useState } from 'react';
import type { Ctx } from './types';

export default function Requests({ ctx }: { ctx: Ctx }) {
  const { plan } = ctx.data;
  const sessions = Object.values(ctx.data.sessions).filter((session) => session.saved);
  const [request, setRequest] = useState(() => localStorage.getItem('kinex-codex-draft') ?? '');

  const updateRequest = (value: string) => {
    setRequest(value);
    localStorage.setItem('kinex-codex-draft', value);
  };

  const requestBody = () => [
    '# Pedido desde KINEX',
    '',
    request.trim(),
    '',
    '---',
    '## Contexto automático',
    `- Semana: ${plan.week || '-'}`,
    `- Foco: ${plan.focus || '-'}${plan.secondary ? ` · ${plan.secondary}` : ''}`,
    `- Sesiones guardadas: ${sessions.length}`,
    `- Enviado: ${new Date().toLocaleString('es-ES')}`,
    '',
    '_Este Issue fue creado desde el Buzón de KINEX. Codex: leer el pedido y aplicar los cambios en la app._',
  ].join('\n');

  const sendRequest = () => {
    if (!request.trim()) { alert('Escribí primero qué querés cambiar o probar.'); return; }
    const title = `KINEX · ${request.trim().slice(0, 72)}`;
    const url = `https://github.com/janoalimentibel-design/kinex/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(requestBody())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyRequest = () => {
    const text = requestBody();
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => alert('Pedido copiado.'));
    else ctx.setModal({ type: 'summary', text });
  };

  return (
    <div className="requests">
      <div className="sectionhead">
        <div>
          <h2>Pedidos</h2>
          <p>Mandame desde acá lo que querés cambiar, probar o sumar.</p>
        </div>
      </div>
      <div className="codexbox">
        <div className="t">Buzón para Codex</div>
        <h3>Escribí tu pedido</h3>
        <p>“Enviar a GitHub” abre un Issue ya redactado. Confirmalo con tu cuenta y después decime <b>“leé los pedidos de Git”</b>.</p>
        <textarea
          value={request}
          onChange={(event) => updateRequest(event.target.value)}
          placeholder="Ej: Para los jueves quiero más espalda y menos ejercicios con banda. Cambiá…"
          autoFocus
        />
        <div className="codex-actions">
          <button className="btn btn-primary" onClick={sendRequest}>Enviar a GitHub ↗</button>
          <button className="btn btn-ghost" onClick={copyRequest}>Copiar pedido</button>
        </div>
        <div className="codex-note">El borrador queda guardado en este dispositivo. GitHub pide la confirmación final: KINEX no guarda ninguna contraseña ni token.</div>
      </div>
    </div>
  );
}
