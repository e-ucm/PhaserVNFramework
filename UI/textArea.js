import { range } from "../utils/misc.js";

export default class TextArea extends Phaser.GameObjects.Text {
    /**
    * Texto que tiene que estar contenido en un area especifica
    * @extends Phaser.GameObjects.Text
    * @param {Phaser.GameObjects.Scene} scene - escena en la que se crea
    * @param {Number} x - posicion x del texto (opcional)
    * @param {Number} y - posicion y del texto (opcional)
    * @param {Number} maxWidth - ancho maximo que puede ocupar el texto (opcional)
    * @param {Number} maxHeight - alto maximo que puede ocupar el texto (opcional)
    * @param {String} text - texto a mostrar (opcional)
    * @param {Object} style - estilo del texto (opcional)
    * @param {Number} originX - origen x del texto [0-1] (si esta alineado en el centro, se ignora) (opcional)
    * @param {Number} originY - origen y del texto [0-1] (si esta alineado en el centro, se ignora) (opcional)
    * @param {Number} paddingX - margen x entre el texto y sus dimensiones maximas (opcional)
    * @param {Number} paddingY - margen y entre el texto y sus dimensiones maximas (opcional)
    * @param {Number} offsetX - offset x del texto (opcional)
    * @param {Number} offsetY - offset y del texto (opcional)
    * @param {Number} alignX - alineacion horizontal del texto [0-1] (opcional)
    * @param {Number} alignY - alineacion vertical del texto [0-1] (opcional)
    */
    constructor(scene, x = 0, y = 0, maxWidth = 100, maxHeight = 100, text = "", style = {},
        originX = 0.5, originY = 0.5, paddingX = 0, paddingY = 0, offsetX = 0, offsetY = 0, alignX = 0.5, alignY = 0.5) {
        // Se crea el texto y se anade a la escena
        super(scene, x, y, text, style);
        scene.add.existing(this);

        // Se calculan las dimensiones maximas en base a las indicadas y el padding
        this.maxWidth = maxWidth - paddingX * 2;
        this.maxHeight = maxHeight - paddingY * 2;

        // Se pone el texto en el origen indicado
        this.setOrigin(originX, originY);

        // Se coloca el texto segun su alineacion y el padding
        this.x += -this.maxWidth * (0.5 - alignX) + paddingX * (0.5 - alignX) * 2 + offsetX;
        this.y += -this.maxHeight * (0.5 - alignY) + paddingY * (0.5 - alignY) * 2 + offsetY;

        if (gameDebug.enableText) {
            this.debugRect = this.scene.add.rectangle(this.x, this.y, this.maxWidth, this.maxHeight, 0xff, 0)
                .setOrigin(originX, originY);
            this.debugRect.setStrokeStyle(2, gameDebug.textColor);

            this.setInteractive();
            scene.input.enableDebug(this, gameDebug.textColor);
            this.disableInteractive();
        }
    }

    /**
    * Comprueba si el texto indicado cabe los limites establecidos
    * @param {String} text - texto a mostrar
    * @returns {Boolean} - true si el texto cabe, false en caso contrario
    */
    fits(text) {
        let prevText = this.text;
        this.setText(text);
        let fits = true;

        // Si el texto no tiene ajuste de linea, cabe si tanto su ancho como su alto no exceden los limites
        if (this.style.wordWrapWidth == null) {
            fits = this.displayWidth <= this.maxWidth && this.displayHeight <= this.maxHeight;
        }
        // Si tiene ajuste de linea, cabe si su alto no excede los limites (independientemente del ancho)
        else {
            fits = this.displayHeight <= this.maxHeight;
        }
        this.setText(prevText);

        // if (!fits) {
        //     console.log(text, this.displayWidth, this.displayHeight, this.maxWidth, this.maxHeight);
        // }
        return fits;
    }


    /**
    * Ajusta automaticamente el tamano de la fuente hasta que quepa al menos 1 caracter
    * @param {String} text - primer caracter del texto a mostrar
    * @param {Number} reduction - reduccion que se le ira aplicando a la fuente cada vez que se compruebe si cabe o no
    */
    adjustFontSize(text = "", reduction = 5) {
        if (text == null || text == "") {
            text = this.text;
        }
        if (text != "") {
            let textConfig = this.style;
            let fontSize = parseInt(textConfig.fontSize.replace("px", ""));

            let fontSizes = range(1, fontSize - 1, reduction);
            
            if (this.maxWidth > 0 && this.maxHeight > 0 && text != "" && !this.fits(text)) {
                let ini = 0;
                let end = fontSizes.length - 1;

                // Divide y venceras
                while (end - ini > 1) {
                    let half = Math.floor((end + ini) / 2);
                    this.setFontSize(fontSizes[half]);

                    if (this.fits(text)) {
                        ini = half;
                    }
                    else {
                        end = half;
                    }
                }

                this.setFontSize(fontSizes[ini]);
            }
        }
    }

    /**
    * Ajusta automaticamente el texto para que quepa dentro de los limites.
    * Si el texto excede el tamano, se recorta progresivamente hasta que encoja
    * 
    * @param {Boolean} keepRight - Si es true, se recortan caracteres por la izquierda (se mantiene el final del texto).
    *                              Si es false, se recortan por la derecha (se mantiene el inicio del texto).
    * @param {String} - texto que se quiere ajustar. Si no se proporciona, se usara el texto actual.
    * @param {Number} - cantidad de caracteres que se eliminan por iteracion (opcionaL9)
    */
    adjustTextLength(keepRight, text = "", reduction = 1) {
        if (text == null || text == "") {
            text = this.text;
        }
        if (text != "") {
            while (this.maxWidth > 0 && this.maxHeight > 0 && text !== "" && !this.fits(text)) {
                if (keepRight) {
                    // Se elimina caracteres del inicio para mantener el final de texto
                    text = text.slice(reduction - text.length);
                }
                else {
                    // Se eliminan caracteres del final para mantener el inicio
                    text = text.slice(0, -reduction);
                }
                this.setText(text);
            }
        }
    }

    setAreaSize(maxWidth, maxHeight) {
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;

        if (gameDebug.enableText) {
            this.debugRect.setSize(this.maxWidth, this.maxHeight);
        }
    }
}