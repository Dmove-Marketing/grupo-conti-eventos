function applyPhoneMask(input: HTMLInputElement) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      v = `(${v}`;
    }
    input.value = v;
  });
}

export function initForms() {
  const forms = document.querySelectorAll<HTMLFormElement>('form[data-form-id]');
  forms.forEach((form) => {
    if ((form as any).__formsInitialized) return;
    (form as any).__formsInitialized = true;

    let started = false;
    const formId  = form.dataset.formId!;
    const project = form.dataset.project || window.location.hostname;

    form.querySelectorAll<HTMLInputElement>('[name="telefone"]').forEach(applyPhoneMask);

    const submitUrl   = form.dataset.submitUrl;
    const redirectUrl = form.dataset.redirect;
    const gridId      = form.dataset.gridId;
    const successId   = form.dataset.successId;

    if (!submitUrl) {
      console.warn(`[Forms] Formulário ${formId} sem URL de webhook (data-submit-url).`);
      return;
    }

    form.addEventListener('focusin', () => {
      if (!started) {
        started = true;
        (window as any).dataLayer?.push({ event: 'form_start', form_id: formId, project });
      }
    });

    const handleSubmit = async () => {

      const hp = form.querySelector<HTMLInputElement>('[name="website"]');
      if (hp && hp.value) return;

      const msgEl = gridId
        ? document.getElementById(gridId)?.querySelector('[id$="FormMsg"]') as HTMLElement | null
        : form.querySelector('.form-error') as HTMLElement | null;

      // Validação de campos obrigatórios
      let firstInvalid: HTMLElement | null = null;
      let isValid = true;

      form.querySelectorAll<HTMLElement>('[required]').forEach((field) => {
        const isEmpty =
          !(field as HTMLInputElement).value ||
          (field.tagName === 'SELECT' && (field as HTMLSelectElement).value === '');

        if (isEmpty) {
          isValid = false;
          (field as HTMLElement).style.borderColor = '#ef4444';
          (field as HTMLElement).style.outline = '2px solid #ef4444';
          if (!firstInvalid) firstInvalid = field;
          const clearError = () => {
            (field as HTMLElement).style.removeProperty('border-color');
            (field as HTMLElement).style.removeProperty('outline');
            field.removeEventListener('input', clearError);
            field.removeEventListener('change', clearError);
          };
          field.addEventListener('input', clearError);
          field.addEventListener('change', clearError);
        }
      });

      // Validação de formato: email
      form.querySelectorAll<HTMLInputElement>('input[type="email"]').forEach((field) => {
        if (!field.value) return; // campo vazio já capturado pelo required acima
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value);
        if (!ok) {
          isValid = false;
          (field as HTMLElement).style.borderColor = '#ef4444';
          (field as HTMLElement).style.outline = '2px solid #ef4444';
          if (!firstInvalid) firstInvalid = field;
          const clear = () => {
            (field as HTMLElement).style.removeProperty('border-color');
            (field as HTMLElement).style.removeProperty('outline');
            field.removeEventListener('input', clear);
          };
          field.addEventListener('input', clear);
        }
      });

      // Validação de formato: telefone (mínimo 10 dígitos — DDD + número)
      form.querySelectorAll<HTMLInputElement>('[name="telefone"]').forEach((field) => {
        if (!field.value) return;
        const digits = field.value.replace(/\D/g, '');
        if (digits.length < 10) {
          isValid = false;
          (field as HTMLElement).style.borderColor = '#ef4444';
          (field as HTMLElement).style.outline = '2px solid #ef4444';
          if (!firstInvalid) firstInvalid = field;
          const clear = () => {
            (field as HTMLElement).style.removeProperty('border-color');
            (field as HTMLElement).style.removeProperty('outline');
            field.removeEventListener('input', clear);
          };
          field.addEventListener('input', clear);
        }
      });

      if (!isValid) {
        if (msgEl) {
          msgEl.innerHTML = 'Preencha corretamente todos os campos obrigatórios destacados para continuar.';
          msgEl.style.display = 'block';
        }
        firstInvalid!.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstInvalid as HTMLElement).focus();
        return;
      }

      const submitBtn  = form.querySelector<HTMLButtonElement>('.form-submit');
      const btnText    = submitBtn?.querySelector<HTMLElement>('.btn-text');
      const btnLoading = submitBtn?.querySelector<HTMLElement>('.btn-loading');

      if (submitBtn) submitBtn.disabled = true;

      if (btnText && btnLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
      } else if (submitBtn && !submitBtn.querySelector('.btn-loading')) {
        const originalText = submitBtn.innerHTML;
        submitBtn.dataset.originalText = originalText;
        submitBtn.innerHTML = 'Enviando...';
      }

      if (msgEl) msgEl.style.display = 'none';

      const formData = new FormData(form);
      const rawData: Record<string, string> = {};
      formData.forEach((v, k) => { if (k !== 'website') rawData[k] = v.toString(); });

      const trackingRaw = sessionStorage.getItem('dmove_tracking');
      const tracking: Record<string, string> = trackingRaw ? JSON.parse(trackingRaw) : {};

      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const payloadFields: Record<string, string> = {};
      
      // Separar Nome e Sobrenome do campo único de nome
      const nomeCompleto = rawData['nome'] || '';
      const nomeParts = nomeCompleto.trim().split(/\s+/);
      payloadFields['Nome'] = nomeParts[0] || '';
      payloadFields['Sobrenome'] = nomeParts.slice(1).join(' ') || '';
      
      // WhatsApp (vinda de telefone)
      payloadFields['WhatsApp'] = rawData['telefone'] || '';
      
      // E-mail (com hífen)
      payloadFields['E-mail'] = rawData['email'] || '';
      
      // Tipo de evento (vinda de evento)
      payloadFields['Tipo de evento'] = rawData['evento'] || '';
      
      // Data do evento formatada como DD/MM/AAAA
      const dataRaw = rawData['data'] || '';
      let dataFormatada = '';
      if (dataRaw.includes('-')) {
        const parts = dataRaw.split('-');
        if (parts.length === 3) {
          dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } else {
        dataFormatada = dataRaw;
      }
      payloadFields['Data do evento'] = dataFormatada;

      // Determina a fonte base de acordo com o padrão do cliente (Landing page/nome-da-pagina)
      let fonteBase = rawData['fonte'];
      if (!fonteBase) {
        const path = window.location.pathname.replace(/^\/|\/$/g, '');
        const pageName = (path === '' || path === 'index.html') ? 'casamentos' : path.replace(/\.html$/, '');
        fonteBase = `Landing page/${pageName}`;
      }

      Object.entries(rawData).forEach(([key, val]) => {
        if (['nome', 'telefone', 'email', 'evento', 'data', 'fonte'].includes(key)) return;
        const capKey = key.charAt(0).toUpperCase() + key.slice(1);
        payloadFields[capKey] = val;
      });

      const trackingParamKeys = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
        'utm_content', 'utm_id', 'gclid', 'gbraid', 'wbraid',
        'fbclid', 'ttclid', 'msclkid', 'sck',
        'fbc', 'fbp', 'external_id', 'event_id',
      ];
      const qs = new URLSearchParams();
      trackingParamKeys.forEach(k => { if (tracking[k]) qs.set(k, tracking[k]); });
      const fonte = qs.toString() ? `${fonteBase}?${qs.toString()}` : fonteBase;

      // Campos Meta CAPI — enviados também como campos flat para uso direto no n8n
      const metaCapi: Record<string, string> = {};
      if (tracking['fbc'])         metaCapi['fbc']         = tracking['fbc'];
      if (tracking['fbp'])         metaCapi['fbp']         = tracking['fbp'];
      if (tracking['external_id']) metaCapi['external_id'] = tracking['external_id'];
      if (tracking['event_id'])    metaCapi['event_id']    = tracking['event_id'];

      const formName = form.dataset.formName || formId;

      const payload: Record<string, string> = {
        ...payloadFields,
        Fonte: fonte,
        Data: dateStr,
        'Horário': timeStr,
        'URL da página': window.location.href,
        'Agente de usuário': navigator.userAgent,
        'IP remoto': '',
        'Desenvolvido por': 'Elementor',
        form_id: formId,
        form_name: formName,
        ...metaCapi,
      };

      try {
        const res = await fetch(submitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('http_' + res.status);

        let json: any = {};
        try { json = await res.json(); } catch {}

        (window as any).dataLayer?.push({ event: 'form_submit', form_id: formId, project, ...payloadFields });

        const redir = redirectUrl || json.redirect;
        if (redir) {
          window.location.href = redir;
          return;
        }

        const gridEl    = gridId    ? document.getElementById(gridId)    : null;
        const successEl = successId ? document.getElementById(successId) : null;

        if (gridEl && successEl) {
          gridEl.style.display = 'none';
          successEl.classList.add('active');
        } else {
          form.innerHTML = `
            <div style="text-align:center;padding:2rem;">
              <div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;background:var(--color-primary,#2563eb);border-radius:50%;color:white;">✓</div>
              <h3 style="font-size:1.15rem;font-weight:600;margin-bottom:4px;">Enviado com sucesso!</h3>
              <p style="color:#666;font-size:0.9rem;">Em breve entraremos em contato.</p>
            </div>`;
        }
      } catch (err: any) {
        (window as any).dataLayer?.push({ event: 'form_error', form_id: formId, error: err.message });

        if (msgEl) {
          msgEl.innerHTML = 'Erro ao enviar. Tente novamente mais tarde.';
          msgEl.style.display = 'block';
        } else {
          alert('Erro ao enviar o formulário. Tente novamente mais tarde.');
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText && btnLoading) {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
          } else if (submitBtn.dataset.originalText) {
            submitBtn.innerHTML = submitBtn.dataset.originalText;
          }
        }
      }
    };

    // Click no botão de envio (type="button" — evita submit nativo capturado pelo GTM)
    const submitBtn = form.querySelector<HTMLButtonElement>('.form-submit');
    submitBtn?.addEventListener('click', handleSubmit);

    // Enter no form (exceto em textarea e button)
    form.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
      e.preventDefault();
      handleSubmit();
    });
  });
}
