import BaseScene from "../scenes/baseScene.js";
import DialogBox from "../UI/dialogBox.js"
import OptionBox from "../UI/optionBox.js";
import DefaultEventNames from "../utils/eventNames.js";
import { splitByWord } from "../utils/misc.js";

export default class BaseUI extends BaseScene {
    /**
    * Clase base para la escena en la que se crean los elementos para la interfaz
    * @extends BaseScene
    */
    constructor(key = "UI") {
        super(key);
    }

    init(params) {
        super.init(params);

        this.textboxConfig = {}
        this.nameBoxConfig = {}
        this.textConfig = {}
        this.nameTextConfig = {}

        this.optionBoxConfig = {}
        this.optionsTextConfig = {}
        this.optionBoxes = [];
    }

    create(params) {
        super.create(params);

        this.bgBlock = this.add.zone(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT).setOrigin(0, 0);

        this.textbox = new DialogBox(this, this.textboxConfig, this.nameBoxConfig, this.textConfig, this.nameTextConfig);


        // Eventos de la UI

        this.currNode = null;
        // Si llega un evento de que ha empezado un nodo, se bloquea el fondo y se guarda el nodo actual
        // para que no se procesen mas nodos hasta que se terminen de procesar todos los nodos pendientes
        this.dispatcher.add(DefaultEventNames.startDialogNode, this, (params) => {
            if (this.currNode == null && params.node != null) {
                this.bgBlock.setInteractive();

                if (gameDebug.enable) {
                    console.log("Starting node:", params.node);
                }

                this.currNode = params.node;
                this.currNode.processNode();

                params.onProcessed();
            }
            this.currNode = params.node;
            // else {
            //     console.warn("Processing node:", node);
            // }
        });

        // Si llega un evento de que se han acabado los nodos, desactiva la caja y se libera el nodo actual
        this.dispatcher.add(DefaultEventNames.endDialogNodes, this, () => {
            this.textbox.activate(false, () => {
                this.bgBlock.disableInteractive();
                this.currNode = null;
            });
        });

        this.configureTextboxEvents();
        this.configureChoicesEvents();
    }

    shutdown() {
        if (this.dispatcher != null) {
            this.textbox.activate(false, () => {
                this.bgBlock.disableInteractive();
                this.currNode = null;
            });
        }
        this.removeOptions();
        super.shutdown();
    }

    configureTextboxEvents() {
        this.textbox.on("pointerdown", () => { this.skipDialog(); });

        // Si llega un evento de empezar nodo de texto, comienza a procesarlo
        this.dispatcher.add(DefaultEventNames.startTextNode, this, (node) => {
            // Recorre todos los fragmentos obtenidos y los divide (por si
            // el texto es demasiado largo y no cabe en la caja de texto). 
            if (!node.textAdjusted) {
                let dialogs = [];

                node.dialogs.forEach((dialog) => {
                    this.splitDialog(dialogs, dialog);
                    // this.splitDialog(dialogs, this.localizationManager.replaceRegularExpressions(dialog));
                })
                node.dialogs = dialogs;
                node.textAdjusted = true;
            }

            // console.log(dialogs);

            this.startTextNode(node);
        });

        // Si llega un evento de actualizar el texto, lo cambia en la caja de texto
        this.dispatcher.add(DefaultEventNames.updateTextNode, this, (node) => {
            this.textbox.setDialog(node.name, node.character, node.dialogs[node.currDialog]);
        });
    }

    startTextNode(node) {
        // Si la caja era visible y el personaje anterior es distinto al actual,
        // se desactiva la caja y se vuelve a activar con el nombre nuevo
        if (this.textbox.visible && this.textbox.lastCharacter != node.character) {
            this.textbox.activate(false, () => {
                this.textbox.setDialog(node.name, node.character, node.dialogs[node.currDialog]);
                this.textbox.activate(true);
            })
        }
        // Si no, si la caja no era visible o el personaje es el mismo, se activa
        // directamente con el nombre nuevo (si ya estaba activa, no hara la animacion)
        else {
            this.textbox.setDialog(node.name, node.character, node.dialogs[node.currDialog]);
            this.textbox.activate(true);
        }
    }


    /**
    * Funcion llamada al pulsar la caja de texto
    */
    skipDialog() {
        // Si no se ha terminado de mostrar todo el dialogo, lo muestra de golpe
        if (!this.textbox.finished) {
            this.textbox.forceFinish();
        }
        // Si se ha pasado el retardo para poder saltar el dialogo, se pasa al siguiente
        else if (this.textbox.canSkip) {
            this.dispatcher.dispatch(DefaultEventNames.nextDialog);
        }
    }


    /**
    * Divide el texto por si alguno es demasiado largo y se sale de la caja de texto
    * @param {String} text - texto a dividir
    */
    splitDialog(dialogs, text) {
        // Se divide el texto por palabras
        // TODO: Confirmar que soporta multiples idiomas
        let splitText = splitByWord(text);

        // console.log(splitted)

        // Si el texto es muy grande para mostar siquiera un caracter, no hace nada
        if (!this.textbox.textFits(text[0][0])) {
            console.warn("Dialog box text size too big! Returning empty dialog");
            return;
        }

        let newText = "";
        // Mientras queden palabras en el array
        while (splitText.length > 0) {
            // Saca la siguiente palabra de la lista de palabras
            let nextWord = splitText.shift();

            // Si no caben porque la palabra entera no cabe en la caja de texto
            // IMPORTANTE: ESTE METODO VA RECONSTRUYENDO EL TEXTO CON CADA LETRA NUEVA Y COMPROBANDO SI CABE DENTRO DE LOS LIMITES
            // DE LA CAJA, POR LO QUE SI LA PALABRA ES LARGUISIMA O LA FUENTE ES ENORME, TARDARA MUCHO TIEMPO EN TERMINAR
            if (!this.textbox.textFits(nextWord)) {
                newText += " ";

                // Mientras quepa el texto con cada caracter de la palabra que no cabe y no se acabe dicha palabra
                while (this.textbox.textFits(newText + nextWord[0]) && nextWord.length > 0) {
                    // Se anade al texto actual el primer caracter de la palabra que no cabe y se elimina de dicha palabra
                    newText += nextWord[0];
                    nextWord = nextWord.slice(1);
                }
                if (newText != "") {
                    dialogs.push(newText);
                }
                newText = "";
                // Se mete el resto de la palabra al principio de la lista
                splitText.unshift(nextWord);
            }
            // Si el texto actual mas la palabra caben, se mantiene en el texto a guardar
            else if (this.textbox.textFits(newText + " " + nextWord)) {
                newText += " " + nextWord;
            }
            // Guarda en la lista de dialogos el dialogo leido
            else {
                dialogs.push(newText);
                newText = "";

                splitText.unshift(nextWord);
            }

            // console.log(newText);
            // console.log(splitText);
        }
        if (newText != "") {
            dialogs.push(newText);
        }
        // console.log(dialogs);
    }



    configureChoicesEvents() {
        this.dispatcher.add(DefaultEventNames.startChoiceNode, this, (node) => {
            this.textbox.activate(false);
            this.createOptions(node);
        });
    }

    /**
    * Crea las opciones 
    * @param {ChoiceNode} node - nodo de eleccion con el array de opciones 
    */
    createOptions(node) {
        // Recorre todos los textos de las opciones
        for (let i = 0; i < node.choices.length; i++) {
            // Crea una OptionBox cuyo onClick establece como siguiente nodo el correspondiente al indice de la opcion elegida y elimina el resto de opciones
            // let opt = new OptionBox(this, i, node.choices.length, this.localizationManager.replaceRegularExpressions(node.choices[i]), () => {
            let opt = new OptionBox(this, i, node.choices.length, node.choices[i], () => {
                // TRACKER EVENT
                this.trackerManager.sendSelectChoice(node.fullId, node.choices[i]);

                this.dispatcher.dispatch(DefaultEventNames.selectChoiceNode, i);

                this.removeOptions();
            }, this.optionBoxConfig, this.optionsTextConfig);

            // Muestra la opcion
            opt.activate(true);

            // Guarda la OptionBox en el array
            this.optionBoxes.push(opt);
        }
    }

    /**
    * Elimina las opciones
    */
    removeOptions() {
        // Recorre cada opcion del array de optionBoxes ocultando la opcion y destruyendola cuando la termina de ocultar,
        this.optionBoxes.forEach((option) => {
            option.activate(false, () => {
                option.destroy();
                this.onOptionRemoval();
            });
        });
        this.optionBoxes = [];
    }

    /**
    * Funcion llamada al eliminar las opciones
    */
    onOptionRemoval() { }
}