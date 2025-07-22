import DialogNode from "../dialogNode.js";
import DefaultEventNames from "../../utils/eventNames.js";
import BaseTrackerManager from "../../managers/baseTrackerManager.js";

export default class TextNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de texto
    * @extends DialogNode
    * 
    * Ejemplo:
        "nodeName": {
            "type": "text",
            "character": "mom",
            "next": "setNotTalked"
            "centered": "true"
        }
    *
    * Archivo de localizacion:
    *   Para un solo fragmento de texto:
            "nodeName": {
                text: "text fragment 1"
            },
    *
    *   Para varios fragmentos de texto (funciona tambien con uno solo):
            "nodeName": [
                {
                    text: "text fragment 1"
                },
                {
                    text: "text fragment 2"
                },
                { ... }
            ] 
    */

    static TYPE = "text";

    /**
    * @param {BaseScene} scene - escena en la que se crea el nodo
    * @param {Object} node - objeto json con la informacion del nodo
    * @param {String} fullId - id completa del nodo en el archivo
    * @param {String} namespace - nombre del archivo de localizacion del que se va a leer 
    */
    constructor(scene, node) {
        super(scene);
        this.trackerManager = BaseTrackerManager.getInstance();

        this.character = node.character;    // id del personaje que habla
        this.name = "",                     // nombre traducido del personaje que habla

        this.dialogs = [];                  // serie de dialogos que se van a mostrar
        this.currDialog = 0;                // indice del dialogo que se esta mostrando

        // indica si el texto esta centrado o no (en caso de que no se especifique aparece alineado arriba a la izquierda)
        this.centered = (node.centered == null) ? false : node.centered;            

        // Guarda el siguiente nodo en la lista de siguientes
        this.next.push(node.next);

        this.textAdjusted = false;
    }

    translate(localizationManager, namespace) {
        this.name = localizationManager.translate(this.character, "names");

        // Se obtiene el dialogo traducido
        let translation = localizationManager.translate(this.fullId, namespace);
        
        // Si el texto no esta dividido en fragmentos, se guarda en el array de fragmentos
        // si no, el array de fragmentos es directamente el obtenido al traducir el nodo
        if (!Array.isArray(translation) && translation != "") {
            this.dialogs.push(translation);
        }
        else if (Array.isArray(translation) && translation.length > 0) {
            this.dialogs = translation;
        }
        
        // Se sustituyen las expresiones regulares
        this.dialogs.forEach((dialog, index, dialogs) => {
            dialogs[index] = localizationManager.replaceRegularExpressions(dialog)
        });
    }

    processNode() {
        this.currDialog = 0;

        // Si hay dialogos
        if (this.dialogs.length > 0) {
            // TRACKER EVENT
            this.trackerManager.sendInitializeDialog(this.name, this.dialogs[this.currDialog]);

            // Se lanza el evento de empezar nodo de texto
            this.dispatcher.dispatch(DefaultEventNames.startTextNode, this);

            // Se escucha el evento de siguiente dialogo
            this.dispatcher.add(DefaultEventNames.nextDialog, this, () => {
                // TRACKER EVENT
                this.trackerManager.sendCompleteDialog(this.name, this.dialogs[this.currDialog]);

                // Se actualiza el dialogo
                this.currDialog++;

                // Si sigue habiendo mas dialogos, se lanza el evento de pasar al siguiente dialogo
                if (this.currDialog < this.dialogs.length) {
                    // TRACKER EVENT
                    this.trackerManager.sendInitializeDialog(this.name, this.dialogs[this.currDialog]);

                    this.dispatcher.dispatch(DefaultEventNames.updateTextNode, this);
                }
                // Si no, pasa al siguiente nodo
                else {
                    this.nextNode();
                }
            });
        }
    }
}