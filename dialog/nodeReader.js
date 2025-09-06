import ConditionNode from "./nodes/conditionNode.js";
import EventNode from "./nodes/eventNode.js";
import TextNode from "./nodes/textNode.js";
import ChoiceNode from "./nodes/choiceNode.js";

export default class NodeReader {
    /**
    * Clase encargada de la lectura de los nodos de dialogo
    * 
    * IMPORTANTE: SI SE QUIEREN ANADIR NUEVOS NODOS O MODIFICAR EL FUNCIONAMIENTO DE LOS TIPOS DE NODOS YA EXISTENTES, 
    * LO IDEAL SERIA MODIFICAR DESDE FUERA EL MAPA NODECONSTRUCTORS PARA ANADIR LA CREACION DEL NUEVO TIPO DE NODO. SI
    * ES COMPLETAMENTE NECESARIO ANADIR NUEVOS PARAMETROS A LA CREACION DEL NODO, SE PUEDE CREAR UNA CLASE QUE HEREDE
    * DE NODEREADER PARA MODIFICAR EL COMPORTAMIENTO DE LOS METODOS, PERO NO SE DEBERIA MODIFICAR LA CLASE BASE DIRECTAMENTE 
    */
    constructor() {
        // Mapa que asocia cada tipo de nodo a su constructora
        this.nodeConstructors = new Map([
            [
                ConditionNode.TYPE,
                (scene, objectJson) => {
                    return new ConditionNode(scene, objectJson);
                }
            ],
            [
                TextNode.TYPE,
                (scene, objectJson) => {
                    return new TextNode(scene, objectJson);
                }
            ],
            [
                ChoiceNode.TYPE,
                (scene, objectJson) => {
                    return new ChoiceNode(scene, objectJson);
                }
            ],
            [
                EventNode.TYPE,
                (scene, objectJson) => {
                    return new EventNode(scene, objectJson);
                }
            ],
        ]);
    }

    /**
    * Crea todos los nodos y luego se encarga de conectarlos
    * @param {Phaser.Scene} scene - escena en la que se crea el nodo
    * @param {Object} fullJson - objeto json donde estan los nodos 
    * @param {String} namespace - nombre del archivo de localizacion del que se va a leer 
    * @param {String} objectName - nombre del objeto en el que esta el dialogo, si es que el json contiene varios dialogos de distintos objetos
    * @returns {Map} - Mapa con todos los nodos leidos
    */
    readNodes(scene, file, namespace, objectName) {
        let nodesMap = new Map();
        this.createNodes(scene, file, namespace, objectName, nodesMap);

        // Recorre todos los nodos guardados en el mapa
        nodesMap.forEach((node) => {
            // Recorre el array de nodos siguientes leyendo sus ids
            for (let i = 0; i < node.next.length; i++) {
                // Obtiene el nodo del mapa a partir de su id y la reemplaza en el array
                let nextNode = nodesMap.get(node.next[i]);
                node.next[i] = nextNode;
            }
            // console.log(node.next)
        });

        return nodesMap;
    }

    /**
    * Se obtienen todos los nodos del objeto json, se crean dependiendo de su tipo, y se guardan al mapa de nodos
    * @param {Phaser.Scene} scene - escena en la que se crea el nodo
    * @param {Object} fullJson - objeto json donde estan los nodos 
    * @param {String} namespace - nombre del archivo de localizacion del que se va a leer 
    * @param {String} objectName - nombre del objeto en el que esta el dialogo, si es que el json contiene varios dialogos de distintos objetos
    * @param {Map} nodesMap - mapa donde se van a guardar los nodos leidos
    * 
    * IMPORTANTE: La estructura de nodos es comun a todos los idiomas y se tiene que guardar con anterioridad
    * al momento de crear la escena para luego pasarlo como parametro file. El archivo del que se van a leer las
    * traducciones es el que se pasa en el parametro namespace, y tiene que pasarse un string con el nombre del
    * archivo sin la extension .json
    */
    createNodes(scene, fullJson, namespace, objectName, nodesMap) {
        let objectJson = (objectName === "") ? fullJson : this.getObjFromName(fullJson, objectName);
        for (const [key, value] of Object.entries(objectJson)) {
            let id = key;

            // La id del nodo debe coincidir tanto en el json como en el archivo de traducciones, pero al estar
            // dentro de un objeto con (por ejemplo) nombre "object", un nodo con la id "name" deberia buscarse 
            // en el archivo de traducciones como object.name, pero la id de nodo seguiria siendo name
            let fullId = (objectName === "") ? id : objectName + "." + id;

            let globalId = namespace + "." + fullId

            // console.log(nodeId, fullId, globalId);

            // Si el nodo no se habia leido, se obtiene su tipo y se crea dependiendo del que sea
            if (!nodesMap.has(globalId)) {
                let type = objectJson[id].type;

                // Se guarda el resto de parametros y se guarda en el mapa de nodos por su id
                if (this.nodeConstructors.has(type)) {
                    let node = this.nodeConstructors.get(type)(scene, objectJson[id]);
                    node.id = id;
                    node.fullId = fullId;
                    node.globalId = globalId;

                    node.nextDelay = (objectJson[id].nextDelay == null) ? 0 : objectJson[id].nextDelay

                    nodesMap.set(id, node);
                }
            }
        }
    }

    /**
    * Obtiene el objeto indicado en el json completo a partir de su nombre
    * @param {Object} obj - objeto json en el que se busca el objeto 
    * @param {String} prop - nombre de la propiedad (o del objeto) que se busca 
    * @returns {Object} - objeto json con el nombre indicado
    */
    getObjFromName(obj, prop) {
        let nestedProperties = prop.split('.');
        let currObj = obj;

        for (let i = 0; i < nestedProperties.length; i++) {
            if (!currObj) {
                return null;
            }
            else {
                currObj = currObj[nestedProperties[i]];
            }
        }
        return currObj;
    }
}