import { createRectTexture } from "../utils/graphics.js";
import ImageArea from "./imageArea.js";
import InteractiveContainer from "./interactiveContainer.js";

export default class RectImageButton extends InteractiveContainer {
    /**
    * Clase para los botones con una imagen principal cuyo fondo es un rectangulo. Si no se especifica nada, por defecto
    * el rectangulo tendra su origen en el centro y la imagen se colocara centrado en el rectangulo
    * 
    * @extends InteractiveContainer
    * @param {Phaser.Scene} scene - escena en la que se va a crear el boton 
    * @param {Number} x - posicion x del boton 
    * @param {Number} y - posicion y del boton 
    * @param {Number} width - ancho del rectangulo
    * @param {Number} height - alto del rectangulo
    * @param {String} imgAtlas - id del atlas en el que esta la imagen (opcional)
    * @param {String} imgId - id de la imagen (opcional)
    * @param {Function} onClick - funcion a llamar al pulsar el boton (opcional)
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
    */
    constructor(scene, x, y, width, height, imgAtlas = "", imgId = "", onClick = () => { }, textureId = "rectButtonTexture",
        rectOriginX = 0.5, rectOriginY = 0.5, radiusPercentage = 0, fillColor = 0xffffff, fillAlpha = 1, borderThickness = 5, borderColor = 0x000000, borderAlpha = 1,
        imgOriginX = 0.5, imgOriginY = 0.5, imgAlpha = 1) {
        super(scene, x, y);

        createRectTexture(this.scene, textureId, width, height, fillColor, fillAlpha, borderThickness, borderColor, borderAlpha, radiusPercentage);

        // Se crea la imagen en base a la textura indicada
        this.rect = this.scene.add.image(0, 0, textureId).setOrigin(rectOriginX, rectOriginY);
        this.add(this.rect);

        let imageX = this.rect.x + this.rect.displayWidth * (0.5 - rectOriginX);
        let imageY = this.rect.y + this.rect.displayHeight * (0.5 - rectOriginY);

        if (imgAtlas === "") {
            this.image = new ImageArea(scene, imageX, imageY, width, height, imgAtlas, imgId, imgOriginX, imgOriginY)
            this.image.setScale(2);
            this.image.setAlpha(imgAlpha);
        }
        else {
            this.image = new ImageArea(scene, imageX, imageY, width, height, imgAtlas, imgId, imgOriginX, imgOriginY)
            this.image.setAlpha(imgAlpha);
        }
        this.image.adjustScale();
        this.add(this.image);

        this.calculateRectangleSize();

        if (onClick != null && typeof onClick === "function") {
            this.onClick = onClick;
            this.setInteractive();
            this.on("pointerdown", onClick);
        }
    }
}