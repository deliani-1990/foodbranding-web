// ============================================================================
//  FoodBranding PR — script compartido por las 7 páginas
// ============================================================================
//
//  >>> LO ÚNICO QUE HAY QUE EDITAR ESTÁ AQUÍ ARRIBA. <<<
//
//  Tres claves. Cuando las tengas, pégalas entre las comillas y listo:
//  el cambio aplica a todas las páginas del sitio a la vez.
//
var FB_CONFIG = {

  // 1. FORMULARIO — para que los leads te lleguen por correo.
  //    Cómo sacarla: entra a https://web3forms.com, escribe info@foodbrandingpr.com
  //    y dale a "Create Access Key". La clave te llega por correo al momento.
  //    No hace falta crear cuenta ni tarjeta.
  //    MIENTRAS ESTÉ VACÍA, el formulario sigue abriendo WhatsApp con normalidad,
  //    pero NO se guarda copia del lead en ningún lado.
  WEB3FORMS_KEY: '37f3c1a6-9055-496e-bfa0-32e22b7a4965',

  // 2. GOOGLE ANALYTICS 4 — empieza con G-
  //    Se saca en analytics.google.com → Administrar → Flujos de datos.
  GA4_ID: 'G-XN1E52MXNB',

  // 3. PIXEL DE META — solo números
  //    Se saca en business.facebook.com → Administrador de eventos.
  META_PIXEL_ID: '709893686124468',

  // Número de WhatsApp al que va el mensaje del formulario.
  WHATSAPP: '17875100010'
};

// ============================================================================
//  De aquí para abajo no hace falta tocar nada.
// ============================================================================

// ── ANALÍTICA ───────────────────────────────────────────────────────────────
// Cada una se carga solo si su clave está puesta. Con la clave vacía no se
// carga nada y no se ve ningún error en la consola.
(function () {
  if (FB_CONFIG.GA4_ID) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + FB_CONFIG.GA4_ID;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', FB_CONFIG.GA4_ID);
  }

  if (FB_CONFIG.META_PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', FB_CONFIG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
})();

// ── CONTACTO ────────────────────────────────────────────────────────────────
// Al enviar hace DOS cosas, en este orden:
//   1. Manda los datos por correo (si hay clave de Web3Forms). Así el lead
//      queda registrado aunque la persona nunca complete el paso de WhatsApp.
//   2. Abre WhatsApp con el mensaje ya redactado.
// Si el correo falla —sin internet, servicio caído— WhatsApp se abre igual:
// nunca se le bloquea el contacto al visitante por un problema nuestro.
(function () {
  var forms = document.querySelectorAll('.contact-form[data-whatsapp]');

  Array.prototype.forEach.call(forms, function (form) {
    var estado = document.createElement('p');
    estado.className = 'form-estado';
    estado.setAttribute('role', 'status');
    estado.setAttribute('aria-live', 'polite');
    form.appendChild(estado);

    function val(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el && el.value ? el.value.trim() : '';
    }

    function armarMensaje() {
      var nombre = (val('nombre') + ' ' + val('apellido')).trim();
      var lines = ['Hola FoodBranding, me gustaría más información.'];
      if (nombre) lines.push('Nombre: ' + nombre);
      if (val('negocio')) lines.push('Negocio: ' + val('negocio'));
      if (val('telefono')) lines.push('Teléfono: ' + val('telefono'));
      if (val('email')) lines.push('Correo: ' + val('email'));
      if (val('metodo_contacto')) lines.push('Método de contacto preferido: ' + val('metodo_contacto'));
      if (val('mensaje')) lines.push('Mensaje: ' + val('mensaje'));
      return lines.join('\n');
    }

    function abrirWhatsApp(texto) {
      var num = form.getAttribute('data-whatsapp') || FB_CONFIG.WHATSAPP;
      window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(texto), '_blank');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var boton = form.querySelector('button[type="submit"]');
      var texto = armarMensaje();

      if (window.gtag) window.gtag('event', 'generate_lead');
      if (window.fbq) window.fbq('track', 'Lead');

      // Sin clave configurada: se comporta como antes, solo WhatsApp.
      if (!FB_CONFIG.WEB3FORMS_KEY) {
        abrirWhatsApp(texto);
        return;
      }

      if (boton) { boton.disabled = true; boton.textContent = 'ENVIANDO...'; }
      estado.textContent = '';
      estado.className = 'form-estado';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: FB_CONFIG.WEB3FORMS_KEY,
          subject: 'Nuevo contacto desde el website — ' + (val('nombre') || 'sin nombre'),
          from_name: 'Website FoodBranding',
          nombre: val('nombre'),
          apellido: val('apellido'),
          negocio: val('negocio'),
          telefono: val('telefono'),
          email: val('email'),
          metodo_contacto: val('metodo_contacto'),
          mensaje: val('mensaje'),
          pagina: window.location.pathname
        })
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.success) throw new Error(d.message || 'error');
        estado.textContent = 'Recibimos tus datos. Te abrimos WhatsApp para que sigamos por ahí.';
        estado.className = 'form-estado form-estado--ok';
        form.reset();
      })
      .catch(function () {
        // El correo falló, pero el visitante no tiene por qué quedarse sin contactar.
        estado.textContent = 'Te abrimos WhatsApp para que nos escribas directo.';
        estado.className = 'form-estado form-estado--aviso';
      })
      .then(function () {
        if (boton) { boton.disabled = false; boton.textContent = 'ENVIAR'; }
        abrirWhatsApp(texto);
      });
    });
  });
})();
