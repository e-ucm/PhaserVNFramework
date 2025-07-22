import { tintAnimation } from "../utils/graphics.js";
import InteractiveContainer from "./interactiveContainer.js";
import RectImageButton from "./rectImageButton.js";
import RectTextButton from "./rectTextButton.js";
import TextArea from "./textArea.js";

export default class Checkbox extends InteractiveContainer {
    /**
    * Clase para una checkbox que permite activar y desactivar su estado
    * 
    * @extends InteractiveContainer
    * @param {Phaser.Scene} scene - escena en la que se va a crear el boton 
    * @param {Number} x - posicion x del boton 
    * @param {Number} y - posicion y del boton 
    * @param {Number} width - ancho de la checkbox
    * @param {Number} height - alto de la checkbox
    * @param {Object} labelTextConfig - configuracion del texto de la etiqueta
    * @param {String} imgAtlas - id del atlas en el que esta la imagen de fondo (opcional)
    * @param {String} textureId - id de la textura que se creara para el fondo de la checkbox. Si no se especifica, se reutilizara la del primer rectangulo sin id que se cree (opcional)
    * @param {Number} radiusPercentage - valor en porcentaje del radio de los bordes [0-100] (opcional)
    * @param {Number} fillColor - valor hex del color por defecto del rectangulo (opcional)
    * @param {Number} fillAlpha - alpha del rectangulo [0-1] (opcional) 
    * @param {Number} borderThickness - ancho del borde del rectangulo (opcional)
    * @param {Number} borderColor - valor hex del color por defecto del borde (opcional)
    * @param {Number} borderAlpha - alpha del borde [0-1] (opcional)
    * @param {Number} normalTintColor - valor hex del color normal (opcional)
    * @param {Number} hoverTintColor - valor hex del color al pasar el puntero por encima (opcional)
    * @param {Number} pressingTintColor - valor hex del color al pulsar el boton (opcional)
    */
    constructor(scene, x, y, width, height, labelTextConfig, textureId = "checkboxTexture",
        radiusPercentage = 0, fillColor = 0xffffff, fillAlpha = 1, borderThickness = 5, borderColor = 0x000000, borderAlpha = 1,
        normalTintColor = 0xffffff, hoverTintColor = 0xd9d9d9, pressingTintColor = 0x969696) {
        super(scene, x, y);

        this.width = width;
        this.height = height;

        this.normalTintColor = normalTintColor;
        this.hoverTintColor = hoverTintColor;
        this.pressingTintColor = pressingTintColor;

        // Se crea la checkbox
        this.checkbox = new RectTextButton(scene, 0, 0, width, height, "✓", labelTextConfig, null,
            textureId, 0.5, 0.5, radiusPercentage, fillColor, fillAlpha, borderThickness, borderColor, borderAlpha,
            0.5, 0.5, 0, 0, 0, 0, 0.5, 0.5);

        // Se elimina la interaccion directa con la caja
        this.checkbox.removeInteractive();
        this.add(this.checkbox);

        this.calculateRectangleSize();

        // Se inicializa la checkbox como desactivada
        this.setState(false);

        tintAnimation(this, this.checkbox.list, () => {
            this.toggleState();
        }, true, false, normalTintColor, hoverTintColor, pressingTintColor);
    }

    /**
    * Anadir un elemento al lado de la checkbox con opciones de posicionamiento y alineación.
    * 
    * @param {Number} paddingX - margen x entre la checkbox y el elemento (opcional)
    * @param {Number} paddingY - margen y entre la checkbox y el elemento (opcional)
    * @param {Number} offsetX - offset x del elemento (opcional)
    * @param {Number} offsetY - offset y del elemento (opcional)
    * @param {Number} alignX - alineacion horizontal del elemento [0-1] (opcional)
    * @param {Number} alignY - alineacion vertical del elemento [0-1] (opcional)
    */
    attachElement(element, paddingX = 0, paddingY = 0, offsetX = 0, offsetY = 0, alignX = 0.5, alignY = 0.5) {
        this.add(element);

        let x = -this.width * (0.5 - alignX) - paddingX * (0.5 - alignX) * 2 + offsetX;
        let y = -this.height * (0.5 - alignY) - paddingY * (0.5 - alignY) * 2 + offsetY;
        element.setPosition(x, y);

        // Se coloca la checkbox encima del elemento
        this.bringToTop(this.checkbox);

        // Por defecto, se puede clicar en toda la nueva area para cambiar el estado de la checkbox
        this.calculateRectangleSize();

        tintAnimation(this, this.getAllChildren(), () => {
            this.toggleState();
        }, true, false, this.normalTintColor, this.hoverTintColor, this.pressingTintColor);
    }

    /**
    * Anadir un texto al lado de la checkbox
    * 
    * @param {Number} width - ancho del rectangulo
    * @param {Number} height - alto del rectangulo
    * @param {String} text - texto a escribir
    * @param {Object} textConfig - configuracion del texto
    * @param {Number} fillAlpha - alpha del rectangulo [0-1] (opcional) 
    * @param {Number} borderThickness - ancho del borde del rectangulo (opcional)
    * @param {Number} borderColor - valor hex del color por defecto del borde (opcional)
    * @param {Number} borderAlpha - alpha del borde [0-1] (opcional)
    * @param {Number} textOriginX - origen x del texto [0-1] (si esta alineado en el centro, se ignora) (opcional)
    * @param {Number} textOriginY - origen y del texto [0-1] (si esta alineado en el centro, se ignora) (opcional)
    * @param {Number} paddingX - margen x entre la checkbox y el texto (opcional)
    * @param {Number} paddingY - margen y entre la checkbox y el texto (opcional)
    * @param {Number} offsetX - offset x del texto (opcional)
    * @param {Number} offsetY - offset y del texto (opcional)
    * @param {Number} alignX - alineacion horizontal del texto [0-1] (opcional)
    * @param {Number} alignY - alineacion vertical del texto [0-1] (opcional)
    */
    attachText(width, height, text, textConfig, textOriginX = 0.5, textOriginY = 0.5,
        paddingX = 0, paddingY = 0, offsetX = 0, offsetY = 0, alignX = 0.5, alignY = 0.5) {

        this.textObj = new TextArea(this.scene, 0, 0, width, height, text, textConfig, textOriginX, textOriginY);
        this.attachElement(this.textObj, paddingX, paddingY, offsetX, offsetY, alignX, alignY);
    }

    /**
    * Anadir una imagen con un fondo al lado de la checkbox
    * 
    * @param {Number} width - ancho del rectangulo
    * @param {Number} height - alto del rectangulo
    * @param {String} text - texto a escribir
    * @param {String} imgAtlas - id del atlas en el que esta la imagen (opcional)
    * @param {String} imgId - id de la imagen
    * @param {String} textureId - id de la textura que se creara para el fondo. Si no se especifica, se reutilizara la del primer rectangulo sin id que se cree (opcional)
    * @param {Number} rectOriginX - origen x del rectangulo [0-1] (opcional)
    * @param {Number} rectOriginY - origen y del rectangulo [0-1] (opcional)
    * @param {Number} radiusPercentage - valor en porcentaje del radio de los bordes [0-100] (opcional)
    * @param {Number} fillColor - valor hex del color por defecto del rectangulo (opcional)
    * @param {Number} fillAlpha - alpha del rectangulo [0-1] (opcional) 
    * @param {Number} borderThickness - ancho del borde del rectangulo (opcional)
    * @param {Number} borderColor - valor hex del color por defecto del borde (opcional)
    * @param {Number} borderAlpha - alpha del borde [0-1] (opcional)
    * @param {Number} imgOriginX - origen x de la imagen [0-1] (opcional)
    * @param {Number} imgOriginY - origen y de la imagen [0-1] (opcional)
    * @param {Number} imgAlpha - alpha de la imagen [0-1] (opcional)
    * @param {Number} paddingX - margen x entre la checkbox y la imagen (opcional)
    * @param {Number} paddingY - margen y entre la checkbox y la imagen (opcional)
    * @param {Number} offsetX - offset x de la imagen (opcional)
    * @param {Number} offsetY - offset y de la imagen (opcional)
    * @param {Number} alignX - alineacion horizontal de la imagen [0-1] (opcional)
    * @param {Number} alignY - alineacion vertical de la imagen [0-1] (opcional)
    */
    attachRectImage(width, height, imgAtlas = "", imgId = "", textureId = "rectButtonTexture",
        rectOriginX = 0.5, rectOriginY = 0.5, radiusPercentage = 0, fillColor = 0xffffff, fillAlpha = 1, borderThickness = 5, borderColor = 0x000000, borderAlpha = 1,
        imgOriginX = 0.5, imgOriginY = 0.5, imgAlpha = 1,
        paddingX = 0, paddingY = 0, offsetX = 0, offsetY = 0, alignX = 0.5, alignY = 0.5) {

        // Se crea la imagen con el fondo
        this.image = new RectImageButton(this.scene, 0, 0, width, height, imgAtlas, imgId, null, textureId,
            rectOriginX, rectOriginY, radiusPercentage, fillColor, fillAlpha, borderThickness, borderColor, borderAlpha,
            imgOriginX, imgOriginY, imgAlpha);
        this.attachElement(this.image, paddingX, paddingY, offsetX, offsetY, alignX, alignY);

        // En este caso, cambiar el estado de la checkbox solo se puede hacer clicando en uno de los dos elementos

        // Se calcula el area de interseccion entre ambos 
        let overlapRect = Phaser.Geom.Rectangle.Intersection(this.checkbox.getBounds(), this.image.getBounds());

        let allChildren = this.getAllChildren();
        tintAnimation(this.checkbox, allChildren, (pointerX, pointerY) => {
            // Si el clic esta en la zona comun, se ignora para evitar doble activacion
            if (!Phaser.Geom.Rectangle.Contains(overlapRect, pointerX, pointerY)) {
                this.toggleState();
            }
        }, true, false, this.normalTintColor, this.hoverTintColor, this.pressingTintColor);

        tintAnimation(this.image, allChildren, () => {
            this.toggleState();
        }, true, false, this.normalTintColor, this.hoverTintColor, this.pressingTintColor);
    }

    setState(checked) {
        this.checked = checked;
        this.checkbox.textObj.setVisible(this.checked);
    }

    isChecked() {
        return this.checked;
    }

    toggleState() {
        this.checked = !this.checked;
        this.checkbox.textObj.setVisible(this.checked);
    }
}