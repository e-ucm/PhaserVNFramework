import { tintAnimation } from "../utils/graphics.js";
import { setInteractive } from "../utils/misc.js";
import InteractiveContainer from "./interactiveContainer.js";
import RectTextButton from "./rectTextButton.js";

export default class TextInput extends InteractiveContainer {
    /**
    * Crear una caja interactiva donde introducir texto
    * 
    * @extends {InteractiveContainer}
    * @param {Phaser.Scene} - escena donde crear la caja
    * @param {Number} x - posicion x de la caja de input
    * @param {Number} y - posicion y de la caja de input
    * @param {Number} width - ancho maximo de la caja
    * @param {Number} height - alto maximo de la caja
    * @param {String} defaultText - texto por defecto que se muestra cuando la caja esta vacia
    * @param {Object} defaultTextConfig - configuracion del texto por defecto
    * @param {Object} textConfig - configuracion del texto
    * @param {String} textureId - id de la textura que se creara para el fondo. Si no se especifica, se reutilizara la del primer rectangulo sin id que se cree (opcional)
    * @param {Number} radiusPercentage - valor en porcentaje del radio de los bordes [0-100] (opcional)
    * @param {Number} fillColor - valor hex del color por defecto del rectangulo (opcional)
    * @param {Number} fillAlpha - alpha del rectangulo [0-1] (opcional) 
    * @param {Number} borderThickness - ancho del borde del rectangulo (opcional)
    * @param {Number} borderNormalColor - valor hex del color por defecto del borde (opcional)
    * @param {Number} borderAlpha - alpha del borde [0-1] (opcional)
    * @param {Number} textPaddingX - margen x del texto (opcional)
    * @param {Number} textAlignY - alineacion vertical del texto [0-1] (opcional)
    * @param {Number} normalTintColor - valor hex del color normal (opcional)
    * @param {Number} hoverTintColor - valor hex del color al pasar el puntero por encima (opcional)
    * @param {Number} pressingTintColor - valor hex del color al pulsar el boton (opcional)
    */
    constructor(scene, x, y, width, height, defaultText, defaultTextConfig, textConfig, textureId = "textInputTexture",
        radiusPercentage = 0, fillColor = 0xffffff, fillAlpha = 1, borderThickness = 5, borderColor = 0x000000, borderAlpha = 1,
        textPaddingX = 10, normalTintColor = 0xffffff, hoverTintColor = 0xd9d9d9, pressingTintColor = 0x969696) {
        super(scene, x, y);

        this.width = width;
        this.normalTintColor = normalTintColor;

        // Se crea el boton rectangular que simular una caja de texto.
        // Se usa el texto por defecto para calcular el tamano inicial de la fuente
        this.rectButton = new RectTextButton(scene, 0, 0, width, height, defaultText, defaultTextConfig, null,
            textureId, 0.5, 0.5, radiusPercentage, fillColor, fillAlpha, borderThickness, borderColor, borderAlpha,
            0, 0.5, textPaddingX, 0, 0, 0, 0, 0.5);
        this.add(this.rectButton);

        this.rectButton.removeInteractive();

        // Se obtiene el tamano de fuente reducida
        let reducedFontSize = this.rectButton.textObj.style.fontSize;

        this.defaultText = defaultText;
        this.defaultTextConfig = defaultTextConfig;
        this.defaultTextConfig.fontSize = reducedFontSize;

        this.text = "";
        this.textConfig = textConfig;
        this.textConfig.fontSize = reducedFontSize;

        // Crear el cursor visual que parpadea mientras se escribe
        this.cursor = this.scene.add.text(0, 0, "|", this.textConfig).setOrigin(0.5, 0.5).setAlpha(0);
        this.add(this.cursor);

        // Animacion que hace parpadear el cursor
        this.cursorTween = this.scene.tweens.add({
            targets: this.cursor,
            paused: true,
            duration: 300,
            hold: 600,
            yoyo: true,
            alpha: 1,
            repeat: -1,
        });

        this.isWriting = false;

        // Habilitar el uso del teclado fisico
        this.activeRegularKeyboard();

        // Habilitar el uso del teclado virtual (pantallas tactiles)
        this.activeOnScreenKeyboard();

        this.calculateRectangleSize();

        this.allChildren = this.getAllChildren();
        tintAnimation(this, this.allChildren, () => {
            this.write();
        }, true, false, normalTintColor, hoverTintColor, pressingTintColor);
    }

    activeRegularKeyboard() {
        // Detectar la pulsacion de teclas fisicas
        this.scene.input.keyboard.on("keydown", (event) => {
            if (!IS_TOUCH && this.isWriting) {
                let change = false;

                // Eliminar el ultimo caracter si se pulsa retroceso
                const BACKSPACE_KEY_CODE = 8;
                if (this.text.length > 0 && event.keyCode === BACKSPACE_KEY_CODE) {
                    change = true;
                    this.text = this.text.slice(0, -1);
                }

                // Anadir caracteres validos al texto
                // p{L} --> letras Unicode
                // p{M} --> signos de puntuacion Unicode
                // \u4E00-\u9FFF --> caracteres chinos
                else if (event.key.length === 1 && event.key.match(/[\p{L}\p{M}\u4E00-\u9FFF' -]/u)) {
                    change = true;
                    this.text += event.key;
                }

                if (change) {
                    this.setText(this.text);
                }
            }
        });
    }

    activeOnScreenKeyboard() {
        // Crear un input inivisible del DOM para el teclado virtual
        this.onScreenKeyboard = document.createElement("input");

        // Colocar el input en un lugar de la pantalla donde no molester y hacerlo invisible
        this.onScreenKeyboard.style.position = "absolute";
        this.onScreenKeyboard.style.top = '50px';
        this.onScreenKeyboard.style.left = '50px';
        this.onScreenKeyboard.style.opacity = '0';
        this.onScreenKeyboard.style.zIndex = '-1';

        // Se coloca en el documento
        document.body.appendChild(this.onScreenKeyboard);

        // Se detecta la entrada de texto en el teclado virtual
        this.onScreenKeyboard.addEventListener("input", (event) => {
            if (IS_TOUCH) {
                // Se cambia el valor del texto por el valor del input
                this.text = event.target.value;
                this.setText(this.text);
            }
        });

        // Se suaviza la aparicion del teclado virtual
        this.onScreenKeyboard.addEventListener("focus", () => {
            this.onScreenKeyboard.scrollIntoView({ behavior: "smooth" });
        });

        // Cuando se pulsa en la pantalla, se sustituye el valor del input
        // por el texto, por si previamente se habia escribo con el teclado regular
        window.addEventListener("touchstart", () => {
            this.onScreenKeyboard.value = this.text;
        });

        // Si se usa el raton, desaparece el teclado virtual
        window.addEventListener("mousedown", () => {
            this.onScreenKeyboard.blur();
        });
    }

    setText(text) {
        this.rectButton.textObj.setText(text);
        // Se eliminan caracteres por la izquierda para que no se salga del rectangulo permitido
        this.rectButton.textObj.adjustTextLength(true);
        // Se desplaza el cursor
        this.cursor.x = this.rectButton.textObj.x + this.rectButton.textObj.displayWidth;
    }

    write() {
        // Se comienza escribir
        this.isWriting = true;
        // Se desactiva la interaccion para no volver a pulsar la caja mientras se esta escribiendo
        this.disableInteractive();
        Phaser.Actions.SetTint(this.allChildren, this.normalTintColor);

        // Si no hay texto escrito, es que estaba el texto por defecto, por lo tanto, hay que eliminarlo
        if (this.text === "") {
            this.setText(this.text);
            this.rectButton.textObj.setStyle(this.textConfig);
        }

        // Se activa el cursor
        this.activateCursor(true);

        // Se muestra el teclado en pantalla si es necesario
        if (IS_TOUCH) {
            this.onScreenKeyboard.focus();
        }

        // Se habilita dejar de escribir pulsando en cualquier lado de la pantalla.
        // Se necesita un temporizador para que no salten los dos eventos de "pointerdown" a la vez
        setTimeout(() => {
            this.scene.input.once("pointerdown", () => {
                // Se deja de escribir
                this.isWriting = false;
                // Se puede volver a interactuar con la caja y, por lo tanto, escribir
                setInteractive(this);

                // Si no hay ningun texto, se muestra el por defecto
                if (this.text === "") {
                    this.rectButton.textObj.setText(this.defaultText)
                    this.rectButton.textObj.setStyle(this.defaultTextConfig);
                }

                // Se desactiva el cursor
                this.activateCursor(false);

                // Se oculta el teclado virtual
                if (IS_TOUCH) {
                    this.onScreenKeyboard.blur();
                }
            })
        }, 10);
    }

    activateCursor(active) {
        if (active) {
            this.cursor.setAlpha(1);
            this.cursorTween.resume();
        }
        else {
            this.cursor.setAlpha(0);
            this.cursorTween.pause();
        }
    }

    getContent() {
        return this.text;
    }

    containsText() {
        return this.text !== "";
    }

    destroy() {
        super.destroy();
        // Se elimina el input del DOM
        this.hiddenInput.remove();
    }
}