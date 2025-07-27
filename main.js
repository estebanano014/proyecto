document.addEventListener('DOMContentLoaded', () => {
  const switches = {
    switch1: false,
    switch2: false,
    switch3: false
  };

  let tieneLlave = false;

  function mostrarMensaje(mensaje) {
    const existente = document.querySelector('#mensaje');
    if (existente) existente.remove();

    const texto = document.createElement('a-entity');
    texto.setAttribute('text', `value: ${mensaje}; color: yellow; align: center; width: 4`);
    texto.setAttribute('position', '0 2 -3');
    texto.setAttribute('id', 'mensaje');
    document.querySelector('a-scene').appendChild(texto);

    setTimeout(() => texto.remove(), 4000);
  }

  function checkPuzzle() {
    if (switches.switch1 && !switches.switch2 && switches.switch3) {
      document.querySelector('#codigoFinal').setAttribute('visible', 'true');
      mostrarMensaje('🧠 ¡Puzzle resuelto! Código: 4721');
    }
  }

  ['switch1', 'switch2', 'switch3'].forEach(id => {
    const el = document.querySelector(`#${id}`);
    el.addEventListener('click', () => {
      switches[id] = !switches[id];
      el.setAttribute('color', switches[id] ? '#00ff00' : '#ff0000');
      checkPuzzle();
    });
  });

  const llave = document.querySelector('#llave');
  llave.addEventListener('click', () => {
    if (!tieneLlave) {
      tieneLlave = true;
      llave.setAttribute('visible', false);
      mostrarMensaje('🔑 Has recogido la llave');
    }
  });

  const puerta = document.querySelector('#puerta');
  puerta.addEventListener('click', () => {
    if (tieneLlave) {
      mostrarMensaje('🚪 ¡Puerta abierta! Escapaste del hospital');
      puerta.setAttribute('animation', {
        property: 'position',
        to: '0 2 -25',
        dur: 1000,
        easing: 'easeOutQuad'
      });
    } else {
      mostrarMensaje('🔒 La puerta está cerrada. Necesitas una llave.');
    }
  });
});
