import ImageTextButton from "./imageTextButton.js";
import { completeMissingProperties } from "../utils/misc.js"
import { DEFAULT_TEXT_CONFIG, tintAnimation } from "../utils/graphics.js"

export default class OptionBox extends ImageTextButton {
    /**
    * Caja de texto para los dialogos
    * @extends ImageTextButton
    * @param {Phaser.Scene} scene - escena en la que se crea (idealmente la escena de UI)
    * @param {Number} index - indice de la opcion de entre todas las opciones
    * @param {Number} totalOpts - numero total de opciones
    * @param {String} text - texto a mostrar en la opcion
    * @param {Function} onClick - funcion a ejecutar al pulsar la opcion (opcional)
    * @param {Object} boxConfig - configuracion de la caja de opcion (opcional)
    * @param {Object} textConfig - configuracion del texto de la caja (opcional)
    */
    constructor(scene, index, totalOpts, text, onClick = {}, boxConfig = {}, textConfig = {}) {
        let DEFAULT_BOX_CONFIG = {
            collectiveAlignY: 1,
            collectiveTopMargin: 0,

            imgX: scene.CANVAS_WIDTH / 2,
            imgAtlas: "",
            img: "optionBox",
            imgOriginX: 0.5,
            imgOriginY: 0.5,
            imgAlpha: 1,
            imgScaleX: 1,
            imgScaleY: 1,

            boxSpacing: 10,

            textPaddingX: 25,
            textPaddingY: 25,

            textOffsetX: 70,
            textOffsetY: 42,

            textOriginX: 0.5,
            textOriginY: 0.5,

            textAlignX: 0.5,
            textAlignY: 0.5,

            realWidth: 0,
            realHeight: 0,

            noTintColor: "#ffffff",
            pointerOverColor: "#d9d9d9"
        }

        // Completar los parametros faltantes de los argumentos
        let completedBoxConfig = completeMissingProperties(boxConfig, DEFAULT_BOX_CONFIG);

        if (textConfig.wordWrap != null) {
            textConfig.wordWrap.width = textConfig.fontSize * 2;
        }
        let completedTextConfig = completeMissingProperties(textConfig, DEFAULT_TEXT_CONFIG);

        super(scene, 0, 0, text, completedTextConfig, onClick, completedBoxConfig.imgAtlas, completedBoxConfig.img, completedBoxConfig.imgOriginX, completedBoxConfig.imgOriginY,
            completedBoxConfig.imgScaleX, completedBoxConfig.imgScaleY, completedBoxConfig.imgAlpha, completedBoxConfig.textOriginX, completedBoxConfig.textOriginY,
            completedBoxConfig.textPaddingX, completedBoxConfig.textPaddingY, completedBoxConfig.textOffsetX, completedBoxConfig.textOffsetY,
            completedBoxConfig.textAlignX, completedBoxConfig.textAlignY);


        // TODO: Meter soporte para agrandar la caja si el texto no cabe (y/o para usar nineslice)


        this.boxConfig = completedBoxConfig;
        this.textConfig = completedTextConfig;


        // Se calcula el ancho en base a la imagen
        if (boxConfig.realWidth == null) {
            this.boxConfig.realWidth = this.image.displayWidth - this.boxConfig.textPaddingX * 2;
        }
        if (boxConfig.realHeight == null) {
            this.boxConfig.realHeight = this.image.displayHeight - this.boxConfig.textPaddingY * 2;
        }

        if (textConfig.wordWrap != null) {
            this.textConfig.wordWrap.width = this.boxConfig.realWidth - this.boxConfig.textPaddingX * 2;
        }


        // Calcular la posicion de la caja dependiendo del numero total de cajas y su alineacion vertical total
        let totalHeight = (this.image.displayHeight + this.boxConfig.boxSpacing);
        let startY = (this.CANVAS_HEIGHT - totalHeight * totalOpts) * this.boxConfig.collectiveAlignY
            + this.image.displayHeight * this.boxConfig.imgOriginY
            + (0.5 - this.boxConfig.collectiveAlignY) * this.boxConfig.boxSpacing;
        let boxY = startY + (totalHeight * index) + this.boxConfig.collectiveTopMargin;

        this.setPosition(this.boxConfig.imgX, boxY);


        // Actualizar la informacion del texto
        this.textObj.setAreaSize(this.boxConfig.realWidth, this.boxConfig.realHeight);
        this.textObj.maxWidth = this.boxConfig.realWidth;
        this.textObj.maxHeight = this.boxConfig.realHeight;
        this.textObj.setStyle(this.textConfig);

        this.textObj.adjustFontSize();

        if (gameDebug.enableText) {
            this.add(this.textObj.debugRect);
        }

        tintAnimation(this, this.list, onClick, true, true);
        this.setVisible(false);
    }
}