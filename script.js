/* script.js - lógica completa: pagos, PDFs, testimonios, firma, toggles */

document.addEventListener('DOMContentLoaded', function() {
  // --- SIGNATURE PAD SETUP ---
  const canvas = document.getElementById('signatureCanvas');
  const signaturePad = new SignaturePad(canvas, {
    backgroundColor: '#ffffff',
    penColor: '#000000'
  });
  document.getElementById('clearSignature')?.addEventListener('click', () => signaturePad.clear());

  // --- SET CONTRACT DATE ---
  const contractDateInput = document.getElementById('contractDate');
  if (contractDateInput) {
    contractDateInput.value = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // --- PAYMENT MODAL SETUP ---
  const checkoutModalEl = document.getElementById('checkoutModal');
  if (checkoutModalEl) {
    checkoutModalEl.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      const product = button?.getAttribute('data-product') || 'LeidyBot1';
      const price = button?.getAttribute('data-price') || '260';
      document.getElementById('modalProductName').textContent = product;
      document.getElementById('modalProductPrice').textContent = `$${price}`;
    });
  }

  // --- TOGGLE PAYMENT INFO ---
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  function updatePaymentInfo() {
    const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    document.getElementById('paypalInfo').style.display = selected === 'paypal' ? 'block' : 'none';
    document.getElementById('bankInfo').style.display = selected === 'bank' ? 'block' : 'none';
  }
  paymentRadios.forEach(r => r.addEventListener('change', updatePaymentInfo));
  updatePaymentInfo();

  // --- COPY HELPERS ---
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showAlert('Copiado al portapapeles', 'success');
    }).catch(() => {
      showAlert('Error al copiar', 'danger');
    });
  }
  document.getElementById('copyPaypal')?.addEventListener('click', () => copyToClipboard('@williarvi'));
  document.getElementById('copyBankKey')?.addEventListener('click', () => copyToClipboard('@WAV687'));

  // --- VALIDATION & UTILITIES ---
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function showAlert(message, type = 'success') {
    // small toast in modal or top
    const container = document.querySelector('.modal.show .modal-body') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    container.prepend(alertDiv);
    setTimeout(() => { alertDiv.remove(); }, 6000);
  }

  // --- PDF GENERATION (Contract & Invoice) ---
  function generateContractPDFBlob(userData, productData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('TRADING INTELIGENTE', 105, 18, null, null, 'center');
    doc.setFontSize(14);
    doc.text('CONTRATO DE LICENCIA DE SOFTWARE', 105, 30, null, null, 'center');

    doc.setFontSize(11);
    doc.text('Datos del Vendedor: Trading Inteligente', 14, 46);
    doc.text('Email: tradinginteligenteap@gmail.com', 14, 52);
    doc.text('Teléfono: +57 3506194991', 14, 58);

    doc.setFontSize(12);
    doc.text('Datos del Comprador:', 14, 74);
    doc.setFontSize(10);
    doc.text(`Nombre: ${userData.name || 'No proporcionado'}`, 14, 80);
    doc.text(`Identificación: ${userData.id || (document.getElementById('contractId')?.value || 'No proporcionada')}`, 14, 86);
    doc.text(`Email: ${userData.email || 'No proporcionado'}`, 14, 92);
    doc.text(`Teléfono: ${userData.phone || 'No proporcionado'}`, 14, 98);
    doc.text(`Dirección: ${userData.address || (document.getElementById('contractAddress')?.value || 'No proporcionada')}`, 14, 104);
    doc.text(`Fecha: ${userData.date || new Date().toLocaleDateString('es-ES')}`, 14, 110);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('1. OBJETO DEL CONTRATO', 14, 126);
    doc.setFontSize(10);
    const terms = [
      'El vendedor transfiere al comprador los derechos de uso del software indicado.',
      'El vendedor no garantiza resultados financieros específicos.',
      'El comprador entiende que el software puede permanecer inactivo en periodos de riesgo elevado.',
      'Se aplican los términos y condiciones publicados en el sitio.'
    ];
    let y = 132;
    terms.forEach(line => { doc.text('- ' + line, 14, y); y += 6; });

    if (userData.signature) {
      try {
        doc.addImage(userData.signature, 'PNG', 14, y + 6, 60, 30);
        doc.text('Firma del Comprador', 14, y + 40);
      } catch (e) {
        // ignore image errors
      }
    }

    // return blob by saving to dataurl then convert
    const dataUriString = doc.output('datauristring');
    return dataUriString;
  }

  function generateInvoicePDFBlob(userData, productData, paymentData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('TRADING INTELIGENTE', 105, 18, null, null, 'center');
    doc.setFontSize(12);
    doc.text('Factura de Venta', 105, 26, null, null, 'center');

    doc.setFontSize(10);
    const invoiceNumber = Math.floor(Math.random() * 900000) + 100000;
    doc.text(`Factura No: ${invoiceNumber}`, 14, 40);
    doc.text(`Fecha: ${userData.date || new Date().toLocaleDateString('es-ES')}`, 14, 46);

    doc.text('Vendedor: Trading Inteligente', 14, 56);
    doc.text('Comprador:', 120, 56);
    doc.text(`${userData.name || 'No proporcionado'}`, 120, 62);

    doc.text('Descripción', 14, 80);
    doc.text(productData.name, 14, 86);
    doc.text(`$${productData.price} USD`, 180, 86, null, null, 'right');

    doc.line(14, 100, 196, 100);
    doc.text('Total:', 150, 110, null, null, 'right');
    doc.text(`$${productData.price} USD`, 180, 110, null, null, 'right');

    doc.text(`Método de pago: ${paymentData.method}`, 14, 126);
    doc.text(`Referencia: ${paymentData.reference}`, 14, 132);

    const dataUriString = doc.output('datauristring');
    return dataUriString;
  }

  // Helper to force download from datauri
  function downloadDataUri(dataUri, filename) {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Collect user data
  function collectUserDataFromPayment() {
    const name = document.getElementById('userName')?.value || document.getElementById('contractName')?.value || '';
    const email = document.getElementById('userEmail')?.value || '';
    const phone = document.getElementById('userPhone')?.value || document.getElementById('contractPhone')?.value || '';
    const address = document.getElementById('contractAddress')?.value || '';
    const signature = signaturePad.isEmpty() ? null : signaturePad.toDataURL('image/png');
    return {
      name, email, phone, address,
      date: new Date().toLocaleDateString('es-ES'),
      signature
    };
  }

  // --- PAYPAL FLOW ---
  document.getElementById('paypalBtn')?.addEventListener('click', function() {
    const name = document.getElementById('userName')?.value;
    const email = document.getElementById('userEmail')?.value;
    const agree = document.getElementById('agreeTermsModal')?.checked;

    if (!name || !email || !agree) {
      showAlert('Completa nombre, email y acepta el contrato antes de continuar', 'danger');
      return;
    }
    if (!validateEmail(email)) {
      showAlert('Email inválido', 'danger');
      return;
    }

    const productName = document.getElementById('modalProductName').textContent || 'LeidyBot1';
    const productPrice = (document.getElementById('modalProductPrice').textContent || '$260').replace('$', '').trim();

    const userData = collectUserDataFromPayment();
    const productData = { name: productName, price: productPrice };
    const paymentData = { method: 'PayPal', reference: '@williarvi', date: userData.date };

    // generate pdf dataURIs
    const invoiceUri = generateInvoicePDFBlob(userData, productData, paymentData);
    const contractUri = generateContractPDFBlob(userData, productData);

    // download both
    downloadDataUri(contractUri, `Contrato_${productData.name}_${(userData.name||'cliente').replace(/\s+/g,'')}.pdf`);
    downloadDataUri(invoiceUri, `Factura_${productData.name}_${(userData.name||'cliente').replace(/\s+/g,'')}.pdf`);

    showAlert('Factura y contrato generados. Serás redirigido a PayPal.', 'success');

    // redirect to PayPal (homepage) in new tab after short delay
    setTimeout(() => {
      window.open('https://www.paypal.com/co/home', '_blank');
      // close modal
      const m = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
      if (m) m.hide();
      // clear fields
      document.getElementById('userName').value = '';
      document.getElementById('userEmail').value = '';
      document.getElementById('userPhone').value = '';
      document.getElementById('agreeTermsModal').checked = false;
      signaturePad.clear();
    }, 700);
  });

  // --- BANK FLOW ---
  document.getElementById('confirmBankPayment')?.addEventListener('click', function() {
    const name = document.getElementById('userName')?.value;
    const email = document.getElementById('userEmail')?.value;
    const agree = document.getElementById('agreeTermsModal')?.checked;

    if (!name || !email || !agree) {
      showAlert('Completa nombre, email y acepta el contrato antes de confirmar', 'danger');
      return;
    }
    if (!validateEmail(email)) {
      showAlert('Email inválido', 'danger');
      return;
    }

    const productName = document.getElementById('modalProductName').textContent || 'LeidyBot1';
    const productPrice = (document.getElementById('modalProductPrice').textContent || '$260').replace('$', '').trim();

    const userData = collectUserDataFromPayment();
    const productData = { name: productName, price: productPrice };
    const paymentData = { method: 'Transferencia Bancaria', reference: '@WAV687', date: userData.date };

    const invoiceUri = generateInvoicePDFBlob(userData, productData, paymentData);
    const contractUri = generateContractPDFBlob(userData, productData);

    downloadDataUri(contractUri, `Contrato_${productData.name}_${(userData.name||'cliente').replace(/\s+/g,'')}.pdf`);
    downloadDataUri(invoiceUri, `Factura_${productData.name}_${(userData.name||'cliente').replace(/\s+/g,'')}.pdf`);

    showAlert('Documentos descargados. Realiza la transferencia a la cuenta NU (llave @WAV687) y envía el comprobante.', 'success');

    const m = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    if (m) m.hide();
  });

  // --- DOWNLOAD CONTRACT BUTTON (contract section) ---
  document.getElementById('downloadContractBtn')?.addEventListener('click', function() {
    if (!document.getElementById('agreeContract')?.checked) {
      showAlert('Debes aceptar el contrato antes de descargar.', 'danger');
      return;
    }
    const productName = 'LeidyBot1';
    const productPrice = '260';
    const userData = {
      name: document.getElementById('contractName')?.value || '',
      id: document.getElementById('contractId')?.value || '',
      email: document.getElementById('userEmail')?.value || '',
      phone: document.getElementById('contractPhone')?.value || '',
      address: document.getElementById('contractAddress')?.value || '',
      date: new Date().toLocaleDateString('es-ES'),
      signature: signaturePad.isEmpty() ? null : signaturePad.toDataURL('image/png')
    };
    const productData = { name: productName, price: productPrice };
    const contractUri = generateContractPDFBlob(userData, productData);
    downloadDataUri(contractUri, `Contrato_${productData.name}_${(userData.name||'cliente').replace(/\s+/g,'')}.pdf`);
    showAlert('Contrato descargado', 'success');
  });

  // --- CONTACT FORM FEEDBACK (if present) ---
  const forms = document.querySelectorAll('form');
  // contact form isn't present as separate, but we handle waitlist and testimonial forms
  const waitlistForm = document.getElementById('waitlistForm');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const em = document.getElementById('waitlistEmail')?.value;
      if (!em || !validateEmail(em)) { showAlert('Introduce un email válido', 'danger'); return; }
      showAlert('Gracias por unirte a la lista de espera. Te notificaremos.', 'success');
      waitlistForm.reset();
      setTimeout(()=> { const mm = bootstrap.Modal.getInstance(document.getElementById('waitlistModal')); if (mm) mm.hide(); }, 900);
    });
  }

  // --- TESTIMONIALS (localStorage) ---
  const testimonialInner = document.getElementById('testimonialInner');
  const initialTestimonials = [
    { name:'Carlos M.', text:'"LeidyBot1 ha transformado mi forma de operar. La gestión de riesgo es excepcional..."' },
    { name:'Ana R.', text:'"Estoy impaciente por probar WilliBot1. Si es la mitad de bueno como LeidyBot1..."' },
    { name:'Javier L.', text:'"Opero con LeidyBot1 en 3 cuentas diferentes... Los resultados son consistentes."' },
    { name:'Laura T.', text:'"Invertí $500 en enero y hoy tengo más de $9,000."' }
  ];
  let testimonials = JSON.parse(localStorage.getItem('ti_testimonials') || 'null') || initialTestimonials;

  function renderTestimonials(list) {
    testimonialInner.innerHTML = '';
    list.forEach((t, idx) => {
      const item = document.createElement('div');
      item.className = 'carousel-item' + (idx===0 ? ' active' : '');
      item.innerHTML = `
        <div class="d-flex gap-3 align-items-center">
          <div class="avatar rounded-circle bg-gold text-dark d-flex align-items-center justify-content-center" style="width:64px;height:64px;font-weight:700">${(t.name[0]||'U')}</div>
          <div>
            <div class="small text-muted">${t.text}</div>
            <div class="mt-2"><strong>${t.name}</strong></div>
          </div>
        </div>
      `;
      testimonialInner.appendChild(item);
    });
  }
  renderTestimonials(testimonials);

  document.getElementById('testimonialForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nm = document.getElementById('testName')?.value.trim();
    const msg = document.getElementById('testMessage')?.value.trim();
    if (!nm || !msg) { showAlert('Completa nombre y testimonio', 'danger'); return; }
    testimonials.unshift({ name: nm, text: `"${msg}"` });
    localStorage.setItem('ti_testimonials', JSON.stringify(testimonials));
    renderTestimonials(testimonials);
    this.reset();
    showAlert('Gracias por tu testimonio. Se ha añadido al carrusel.', 'success');
  });

  // END DOMContentLoaded
});
