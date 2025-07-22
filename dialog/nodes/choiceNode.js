import DialogNode from "../dialogNode.js";
import DefaultEventNames from "../../utils/eventNames.js";

export default class ChoiceNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de opcion multiple
    * @extends DialogNode
    * 
    * Ejemplo:
        "nodeName": {
            "type": "choice",
            "choices":[
                { "next": "choice1", repeat: false },
                { "next": "choice2" },
                { ... }
            ],
            "shuffle": true
        }
    *
    * Archivo de localizacion:
        "nodeName": [
            {
                text: "text choice 1"
            },
            {
                text: "text choice 2"
            },
            { ... }
        ]
    */

    static TYPE = "choice";

    /**
    * @param {BaseScene} scene - escena en la que se crea el nodo
    * @param {Object} node - objeto json con la informacion del nodo
    * @param {String} fullId - id completa del nodo en el archivo
    */
    constructor(scene, node) {
        super(scene);

        this.choices = [];              // Lista con el texto traducido de cada opcion
        this.repeat = [];
        this.shuffle = (node.shuffle == null) ? false : node.shuffle;

        // Recorre cada opcion del nodo y guarda el nodo siguiente a cada opcion y si se puede repetir la eleccion
        if (node.choices != null) {
            node.choices.forEach((choice) => {
                this.next.push(choice.next)
                this.repeat.push(choice.repeat);
            });
        }
    }

    translate(localizationManager, namespace) {
        // Obtiene el texto traducido de las opciones y lo guarda en la lista
        this.choices = localizationManager.translate(this.fullId, namespace);

        // Se sustituye usando las expresiones regulares
        this.choices.forEach((choice, index, choices) => {
            choices[index] = localizationManager.replaceRegularExpressions(choice)
        });

        // Si se elige que el orden de las respuestas se aleatorio, se barajan tanto
        // el texto de las opciones como los nodos siguientes con el Fisher-Yates Shuffle
        if (this.shuffle != null && this.shuffle) {
            for (let i = this.choices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.choices[i], this.choices[j]] = [this.choices[j], this.choices[i]];
                [this.next[i], this.next[j]] = [this.next[j], this.next[i]];
                [this.repeat[i], this.repeat[j]] = [this.repeat[j], this.repeat[i]];
            }
        }
    }

    processNode() {
        if (this.choices.length > 0) {
            this.dispatcher.dispatch(DefaultEventNames.startChoiceNode, this);
            this.dispatcher.add(DefaultEventNames.selectChoiceNode, this, (index) => {
                this.nextIndex = index;
                this.nextNode();
            });
        }
        else {
            this.nextNode();
        }
    }

    nextNode() {
        super.nextNode();

        // Si la opcion elegida no se repite, se elimina de la lista de opciones una vez se haya pasado a procesar el nodo siguiente
        if (this.repeat[this.nextIndex] != null && !this.repeat[this.nextIndex]) {
            setTimeout(() => {
                this.choices.splice(this.nextIndex, 1);
                this.next.splice(this.nextIndex, 1);
                this.repeat.splice(this.nextIndex, 1);
            }, this.nextDelay);
        }
    }
}