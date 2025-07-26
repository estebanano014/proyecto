// js/game-logic.js

// Estado del juego
let gameState = {
    currentRoom: 'starting-room',
    inventory: {}, // Para guardar objetos como la llave
    puzzleSolved: false,
    doorOpenings: {
        'door-to-hallway': false,
        'door-to-archives': false,
        'door-to-surgery': false,
        'main-exit-door': false
    }
};

const messageOverlay = document.getElementById('message-overlay');
const interactionText = document.getElementById('interaction-text');

function showMessage(msg, duration = 3000) {
    messageOverlay.textContent = msg;
    messageOverlay.style.display = 'block';
    setTimeout(() => {
        messageOverlay.style.display = 'none';
    }, duration);
}

function showInteractionText(msg) {
    interactionText.textContent = msg;
    interactionText.style.display = 'block';
}

function hideInteractionText() {
    interactionText.style.display = 'none';
}

// --- Componentes Personalizados de A-Frame ---

// Componente para luces parpadeantes
AFRAME.registerComponent('light-flicker', {
    schema: {
        flickerRate: {type: 'number', default: 100}, // ms entre cambios
        minIntensity: {type: 'number', default: 0.1},
        maxIntensity: {type: 'number', default: 1.0}
    },
    init: function () {
        this.originalIntensity = this.el.components.light.attrValue.intensity;
        this.flickerInterval = setInterval(() => {
            const newIntensity = Math.random() * (this.data.maxIntensity - this.data.minIntensity) + this.data.minIntensity;
            this.el.setAttribute('light', 'intensity', newIntensity);
        }, this.data.flickerRate);
    },
    remove: function () {
        clearInterval(this.flickerInterval);
        this.el.setAttribute('light', 'intensity', this.originalIntensity); // Restaurar intensidad al remover
    }
});

// Componente para puertas
AFRAME.registerComponent('door-controller', {
    schema: {
        open: {type: 'boolean', default: false},
        requiredItem: {type: 'string', default: null} // ID del item necesario para abrir
    },
    init: function () {
        const el = this.el;
        const data = this.data;
        const targetRoom = el.getAttribute('data-target-room'); // Para cambiar de habitación

        // Estado inicial de la puerta
        if (data.open) {
            el.setAttribute('rotation', '0 90 0'); // Asume que rotar 90 grados la abre
        }

        el.addEventListener('click', () => {
            if (data.open) {
                // Si la puerta ya está abierta, ir a la siguiente habitación
                if (targetRoom) {
                    console.log('Cambio a habitación:', targetRoom);
                    switchRoom(targetRoom);
                    el.emit('door-open'); // Emitir evento para sonido si se desea
                }
            } else {
                // Intentar abrir la puerta
                if (data.requiredItem && !gameState.inventory[data.requiredItem]) {
                    showMessage(`Necesitas la ${data.requiredItem} para abrir esta puerta.`, 2000);
                    return;
                }

                // Abrir la puerta
                data.open = true;
                gameState.doorOpenings[el.id] = true; // Actualizar estado global
                el.setAttribute('animation', {
                    property: 'rotation',
                    to: '0 90 0', // Asume que rotar 90 grados la abre
                    dur: 800,
                    easing: 'easeOutQuad'
                });
                showMessage('La puerta se ha abierto.', 1500);
                el.querySelector('a-text').setAttribute('value', 'Abierto'); // Cambiar texto si existe
                el.emit('door-open'); // Emitir evento para sonido
                
                // Si es la puerta principal, el juego termina
                if (el.id === 'main-exit-door') {
                    showMessage('¡Has escapado del Hospital Abandonado!', 5000);
                    setTimeout(() => {
                        alert('¡Felicidades, escapaste!');
                        // Opcional: Redirigir o reiniciar el juego
                    }, 5000);
                }
            }
        });

        // Eventos para el texto de interacción al pasar el cursor
        el.addEventListener('mouseenter', () => {
            if (data.open) {
                showInteractionText(`Click para ir a ${targetRoom ? targetRoom.replace('-', ' ').toUpperCase() : 'otro lugar'}`);
            } else if (data.requiredItem && !gameState.inventory[data.requiredItem]) {
                showInteractionText(`Necesitas la ${data.requiredItem} para abrir.`);
            } else {
                showInteractionText('Click para abrir la puerta.');
            }
        });
        el.addEventListener('mouseleave', () => {
            hideInteractionText();
        });
    }
});

// Componente para recoger objetos
AFRAME.registerComponent('item-pickup', {
    schema: {
        itemName: {type: 'string'}
    },
    init: function () {
        const el = this.el;
        const data = this.data;

        el.addEventListener('click', () => {
            if (!gameState.inventory[data.itemName]) {
                gameState.inventory[data.itemName] = true;
                el.setAttribute('visible', false); // Ocultar el objeto
                showMessage(`Has recogido: ${data.itemName.toUpperCase()}`, 2000);
                console.log('Inventario:', gameState.inventory);
            }
        });

        el.addEventListener('mouseenter', () => {
            if (!gameState.inventory[data.itemName]) {
                showInteractionText(`Click para recoger ${data.itemName.toUpperCase()}`);
            }
        });
        el.addEventListener('mouseleave', () => {
            hideInteractionText();
        });
    }
});

// Componente para el puzle
AFRAME.registerComponent('puzzle-controller', {
    schema: {
        status: {type: 'string', default: 'locked'}, // 'locked', 'revealed'
        solutionCode: {type: 'string', default: '1785'} // Código de ejemplo
    },
    init: function () {
        const el = this.el;
        const data = this.data;
        const solutionTextEl = document.getElementById('puzzle-solution-code');

        el.addEventListener('click', () => {
            if (data.status === 'locked') {
                // Lógica del puzle. Esto es un ejemplo simple, podrías hacer un popup con inputs.
                const userAttempt = prompt("Ingresa el código que encuentres (ej. 1785):");
                if (userAttempt === data.solutionCode) {
                    data.status = 'revealed';
                    gameState.puzzleSolved = true;
                    el.querySelector('a-text').setAttribute('value', 'Puzle RESUELTO');
                    solutionTextEl.setAttribute('visible', true); // Mostrar el código
                    showMessage('¡Puzle resuelto! El código ha sido revelado.', 3000);
                    console.log('Puzle resuelto:', gameState.puzzleSolved);
                } else {
                    showMessage('Código incorrecto. Sigue buscando pistas.', 2000);
                }
            } else {
                showMessage('El puzle ya está resuelto.', 1500);
            }
        });

        el.addEventListener('mouseenter', () => {
            if (data.status === 'locked') {
                showInteractionText('Click para interactuar con el puzle.');
            } else {
                showInteractionText('Puzle resuelto. Observa el código.');
            }
        });
        el.addEventListener('mouseleave', () => {
            hideInteractionText();
        });
    }
});


// Función para cambiar de habitación
function switchRoom(newRoomId) {
    // Ocultar la habitación actual
    const currentRoomEl = document.getElementById(gameState.currentRoom);
    if (currentRoomEl) {
        currentRoomEl.setAttribute('visible', false);
    }

    // Mostrar la nueva habitación y ajustar la posición del jugador
    const newRoomEl = document.getElementById(newRoomId);
    if (newRoomEl) {
        newRoomEl.setAttribute('visible', true);
        gameState.currentRoom = newRoomId;

        // Reposicionar al jugador según la habitación (ajusta estos valores)
        const playerEl = document.getElementById('player');
        switch (newRoomId) {
            case 'starting-room':
                playerEl.setAttribute('position', '0 1.6 0');
                break;
            case 'hallway':
                playerEl.setAttribute('position', '0 1.6 -8'); // Al inicio del pasillo
                // Asegúrate de que la puerta principal sea accesible desde aquí, o desde otra sala
                 document.getElementById('main-exit-door').setAttribute('visible', true); // Hacer visible la puerta principal
                break;
            case 'archives-room':
                playerEl.setAttribute('position', '-10 1.6 -8'); // Al inicio del cuarto de archivos
                break;
            case 'surgery-room':
                playerEl.setAttribute('position', '10 1.6 -8'); // Al inicio de la sala quirúrgica
                break;
        }
    }
}


// Iniciar el juego
document.addEventListener('DOMContentLoaded', () => {
    showMessage('Despiertas aturdido. Encuentra la llave y el código para escapar.', 5000);
    // Asegúrate de que solo la primera habitación sea visible al inicio
    document.getElementById('hallway').setAttribute('visible', false);
    document.getElementById('archives-room').setAttribute('visible', false);
    document.getElementById('surgery-room').setAttribute('visible', false);
    document.getElementById('main-exit-door').setAttribute('visible', false); // Oculta la puerta principal hasta llegar al pasillo
});