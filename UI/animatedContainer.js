import { fadeAnimation } from "../utils/graphics.js";

export default class AnimatedContainer extends Phaser.GameObjects.Container {
    /**
    * Clase que extiende Container para agregar animaciones al activar/desactivar la visibilidad
    * @extends Phaser.GameObjects.Container
    * @param {Phaser.Scene} scene - escena a la que pertenece
    * @param {Number} x - posicion x (opcional)
    * @param {Number} y - posicion y (opcional)
    */
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);
        this.scene = scene;

        // Configuracion de las animaciones
        this.animConfig = {
            fadeTime: 150,
            fadeEase: "linear"
        }
        this.fadeAnim = null;

        scene.add.existing(this);

        this.CANVAS_WIDTH = scene.sys.game.canvas.width
        this.CANVAS_HEIGHT = scene.sys.game.canvas.height;
    }

    /**
    * Para activar o desactiar los objetos con una animacion de opacidad
    * @param {Boolean} active - si se va a activar el objeto
    * @param {Function} onComplete - funcion a la que llamar cuando acaba la animacion (opcional)
    * @param {Number} delay - tiempo en ms que tarda en llamarse a onComplete (opcional)
    */
    activate(active, onComplete = () => { }, delay = 0) {
        this.fadeAnim = fadeAnimation(this, active);

        // Al terminar la animacion, se ejecuta el onComplete si es una funcion valida
        this.fadeAnim.on("complete", () => {
            if (!active) {
                this.setVisible(false);
            }

            setTimeout(() => {
                onComplete();
            }, delay);
        });
    }

    /**
    * Devolver todos los hijos que hay en el container, incluyendo los hijos de cualquier container hijo
    * @returns {Array, Phaser.GameObject}
    */
    getAllChildren() {
        let allChildren = [];
        // Se usa una pila para procesar los container.
        // Se comienza con el container actual
        let containerStack = [this];

        while (containerStack.length > 0) {
            // Se extrae el container mas reciente para procesar sus hijos
            let container = containerStack.pop();
            container.list.forEach(child => {
                // Si el hijo es un container, se mete en la pila
                if (child instanceof Phaser.GameObjects.Container) {
                    containerStack.push(child);
                }
                else {
                    // Si no, se anade a la lista de hijos
                    allChildren.push(child);
                }
            })
        }

        return allChildren;
    }

    /**
     * Convertir un punto de coordenadas globales (mundo) a coordenadas locales del container
     * @param {Number} worldX - posicion x en el espacio global
     * @param {Number} worldY - posicion y en el espacio global
     * @returns {{x: Number, y: Number}} - posiciones x, y en el espacio local
     */
    worldToLocal(worldX, worldY) {
        // Se obtiene la matriz de transformaciones global (mundo) del container
        let matrix = this.getWorldTransformMatrix();

        // La matriz de mundo convierte local -> global,
        // asi que su inversa global -> local
        let localPoint = matrix.applyInverse(worldX, worldY);
        return localPoint;
    }

    /**
    * Establecer el origen del container.
    * Es decir, se reposicionan todos los elementos para que un punto especifico del bounding box
    * quede en el origen (0,0) del espacio local del container
    * @param {Number} originX - origen en x [0, 1] (opcional)
    * @param {Number} originY - origen en y [0, 1] (opcional)
    */
    setContainerOrigin(originX = 0.5, originY = originX) {
        // Se obtiene la bounding box, que esta en coordenadas globales
        let bounds = this.getBounds();

        // Se convierte la esquina superior izquierda a coordenadas locales
        let topLeft = this.worldToLocal(bounds.x, bounds.y);
        let width = bounds.width;
        let height = bounds.height;

        // Se calcula el offset, que depende del origen definido
        let offsetX = topLeft.x + width * originX;
        let offsetY = topLeft.y + height * originY;

        // Se aplica el offset a todos los hijos para ajustar su posicion relativa
        this.list.forEach(child => {
            child.x -= offsetX;
            child.y -= offsetY;
        });

        // this.x += offsetX;
        // this.y += offsetY;
    }
}