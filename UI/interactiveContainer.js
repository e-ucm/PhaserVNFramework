import { setInteractive } from "../utils/misc.js";
import AnimatedContainer from "./animatedContainer.js";

export default class InteractiveContainer extends AnimatedContainer {
    /**
    * Clase base para los contenedores interactuables, con metodos para calcular su rectangulo de colision
    * @extends AnimatedContainer
    * @param {Phaser.Scene} scene - escena a la que pertenece
    * @param {Number} x - posicion x (opcional)
    * @param {Number} y - posicion y (opcional)
    */
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);
    }

    /**
    * Activa o desactiva los objetos indicados
    * @param {Boolean} active - si se va a activar el objeto
    * @param {Function} onComplete - funcion a la que llamar cuando acaba la animacion (opcional)
    * @param {Number} delay - tiempo en ms que tarda en llamarse a onComplete (opcional)
    */
    activate(active, onComplete = () => { }, delay = 0) {
        // Si se va a desactivar, se desactiva la interaccion inmediatamente para 
        // que no se pueda seguir interactuando mientras se reproduce la animacion
        if (!active) {
            this.disableInteractive();
        }

        super.activate(active, onComplete, delay);

        // Si se va a activar, se activa la interaccion una vez termina la animacion 
        // para que no se pueda interactuar mientras se esta reproduciendo
        if (active) {
            this.fadeAnim.on("complete", () => {
                setInteractive(this);
            });
        }
    }


    /**
    * Obtiene las dimensiones del rectangulo del container para hacerlo interactivo
    * @param {String} objectName - nombre del objeto a imprimir en el debug (opcional)
    */
    calculateRectangleSize(objectName = "") {
        // Si no se elimina y se vuelve a llamar este metodo, la nueva zona no se calcula bien
        this.removeInteractive();

        // Esta en coordenadas globlaes
        let dims = this.getBounds();
        this.setSize(dims.width, dims.height);

        let rectangle = new Phaser.Geom.Rectangle(dims.x + dims.width / 2 - this.x, dims.y + dims.height / 2 - this.y,
            dims.width, dims.height);

        setInteractive(this, {
            hitArea: rectangle,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });

        if (gameDebug.enable) {
            this.on("pointerdown", () => {
                console.log("clicking", objectName);
            });
        }
        this.disableInteractive();
    }
}