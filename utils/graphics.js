import { setInteractive } from "./misc.js";

// Configuracion de texto por defecto
export let DEFAULT_TEXT_CONFIG = {
    fontFamily: "Arial",        // Fuente (tiene que estar precargada en el html o el css)
    fontSize: 25,               // Tamano de la fuente del dialogo
    fontStyle: "normal",        // Estilo de la fuente
    backgroundColor: null,      // Color del fondo del texto
    color: "#ffffff",           // Color del texto
    stroke: "#000000",          // Color del borde del texto
    strokeThickness: 5,         // Grosor del borde del texto 
    align: "left",              // Alineacion del texto ("left", "center", "right", "justify")
    wordWrap: null,
    padding: null               // Separacion con el fondo (en el caso de que haya fondo)
}

export function componentToHex(component) {
    // Se convierte en un numero de base 16, en string
    let hex = component.toString(16);
    // Si el numero es menor que 16, solo tiene un digito, por lo que hay que anadir un 0 delante
    return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(R, G, B) {
    return "#" + componentToHex(R) + componentToHex(G) + componentToHex(B);
}

export function hexToRgb(hex) {
    // ^ ---> tiene que comenzar por #
    // a-f\d --> caracteres entre a-f y entre 0-9 (\d)
    // {2} --> grupo de dos caracteres que cumplan la condicion de arriba
    // $ --> final de la cadena. De modo que por ejemplo, "Some text #ffffff some more" no valdria
    // i --> se permiten letras en minuscula y en mayuscula
    let regex = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
    let result = regex.exec(hex);

    if (result) {
        return {
            R: parseInt(result[1], 16),
            G: parseInt(result[2], 16),
            B: parseInt(result[3], 16)
        }
    }
    return null;
}

export function hexToColor(hex) {
    return Phaser.Display.Color.IntegerToColor(hex);
}

/**
* Crea una textura a partir de un rectangulo con las caracteristicas indicadas
* @param {Phaser.Scene} scene - escena con acceso a las texturas existentes
* @param {String} textureId - id de la textura que se creara para el rectangulo. Si no se especifica, se reutilizara la del primer rectangulo sin id que se cree
* @param {Number} width - ancho del rectangulo
* @param {Number} height - alto del rectangulo
* @param {Number} fillColor - valor hex del color por defecto del rectangulo (opcional)
* @param {Number} fillAlpha - alpha del rectangulo [0-1] (opcional) 
* @param {Number} borderThickness - ancho del borde del rectangulo (opcional)
* @param {Number} borderColor - valor hex del color por defecto del borde (opcional)
* @param {Number} borderAlpha - alpha del borde [0-1] (opcional)
* @param {Number} radiusPercentage - valor en porcentaje del radio de los bordes [0-100] (opcional)
*/
export function createRectTexture(scene, textureId = "rectTexture", width, height,
    fillColor = 0xffffff, fillAlpha = 1, borderThickness = 5, borderColor = 0x000000, borderAlpha = 1, radiusPercentage = 0) {
    if (!scene.textures.exists(textureId)) {
        // Se crea el rectangulo con el borde
        let graphics = scene.add.graphics();
        graphics.fillStyle(fillColor, fillAlpha);
        graphics.lineStyle(borderThickness, borderColor, borderAlpha);

        // Se calcula el radio y se rellenan el rectangulo y el borde redondeados
        let radius = Math.min(width, height) * (radiusPercentage / 100);
        graphics.fillRoundedRect(borderThickness, borderThickness, width, height, radius);
        graphics.strokeRoundedRect(borderThickness, borderThickness, width, height, radius);

        // Se crea la textura a utilizar para el fondo
        graphics.generateTexture(textureId, width + borderThickness * 2, height + borderThickness * 2);
        graphics.destroy();
    }
}

/**
* Crea una textura a partir de un circulo con las caracteristicas indicadas
* @param {Phaser.Scene} scene - escena con acceso a las texturas existentes
* @param {String} textureId - id de la textura que se creara para el circulo. Si no se especifica, se reutilizara la del primer circulo sin id que se cree
* @param {Number} radius - radio del circulo
* @param {Number} fillColor - valor hex del color por defecto del circulo (opcional)
* @param {Number} fillAlpha - alpha del circulo [0-1] (opcional) 
* @param {Number} borderThickness - ancho del borde del circulo (opcional)
* @param {Number} borderNormalColor - valor hex del color por defecto del borde (opcional)
* @param {Number} borderAlpha - alpha del borde [0-1] (opcional)
*/
export function createCircleTexture(scene, textureId = "circleTexture", radius,
    fillColor = 0xffffff, fillAlpha = 1, borderThickness = 5, borderNormalColor = 0x000000, borderAlpha = 1) {
    if (!scene.textures.exists(textureId)) {
        let graphics = scene.add.graphics();
        graphics.fillStyle(fillColor, fillAlpha);
        graphics.lineStyle(borderThickness, borderNormalColor, borderAlpha);

        let circle = new Phaser.Geom.Circle(radius + borderThickness / 2, radius + borderThickness / 2, radius);
        graphics.fillCircleShape(circle);
        graphics.strokeCircleShape(circle);

        graphics.generateTexture(textureId, (radius + borderThickness) * 2, (radius + borderThickness) * 2);
        graphics.destroy();
    }
}


/**
* Prepara el boton para anadirle posteriormente una animacion
* @param {Phaser.GameObject} button - elemento que reaccionara a los eventos del raton
* @param {Boolean} overrideOnClick - true si se quieren sustituir todos los callbacks que tuviera el objeto en su evento pointerdown, false en caso contrario 
*/
function prepareButtonInteraction(button, overrideOnClick = false) {
    setInteractive(button);

    if (overrideOnClick) {
        button.off("pointerdown");
    }
}


/**
* Anadir animacion de mostrar/ocultar un objeto con un fade in/out
* @param {Phaser.GameObject, Array} targets - elemento/s que haran la animacion
* @param {Boolean} makeVisible - true si se quiere mostrar el objetivo, false en caso contrario
* @param {Number} duration - duracion en ms que durara el fade (opcional)
* @param {Phaser.Math.Easing, String} ease - funcion de suavizado que aplicar a la animacion (opcional)
* @returns {Phaser.Tweens.Tween} - instancia de la animacion reproducida (por si se quieren anadir eventos que reaccionen a ella)
*/
export function fadeAnimation(targets, makeVisible, duration = 150, ease = Phaser.Math.Easing.Linear) {
    let isArray = false;
    let mainTarget = targets;
    let visible = false;

    if (Array.isArray(targets)) {
        isArray = true;
        if (targets.length > 0) {
            mainTarget = targets[0];
            visible = mainTarget.visible;
        }
    }
    else {
        visible = targets.visible;
    }

    // Configura el alpha y la duracion segun la visibilidad del objetivo y el estado al que se quiere pasar
    let initAlpha = 0;
    let endAlpha = 1;
    if (!makeVisible) {
        initAlpha = 1;
        endAlpha = 0;
    }
    
    // Si la visibilidad que se le va a poner al objeto es la misma que la que ya tiene, 
    // el alpha inicial y final seran iguales y la duracion de la animacion sera 0
    if (makeVisible == visible) {
        initAlpha = endAlpha;
        duration = 0;
    }
    // Si no, fuerza la opacidad a la inicial
    else {
        if (isArray) {
            targets.forEach((elem) => {
                elem.setVisible(true);
                elem.setAlpha(initAlpha);
            });
        }
        else {
            targets.setVisible(true);
            targets.setAlpha(initAlpha);
        }
    }

    let anim = mainTarget.scene.tweens.add({
        targets: targets,
        alpha: { from: initAlpha, to: endAlpha },
        ease: ease,
        duration: duration,
        repeat: 0,
    });
    anim.on("complete", () => {
        if (isArray) {
            targets.forEach((elem) => {
                elem.setVisible(makeVisible);
            });
        }
        else {
            targets.setVisible(makeVisible);
        }
    });

    return anim;
}

/**
* Una vez terminada la animacion indicada, se ejecuta el onClick y se reactiva la interaccion si no es una interaccion unica
* @param {Phaser.GameObject} button - elemento que reaccionara a los eventos del raton
* @param {Phaser.Tweens.Tween} anim - tween que esperar a que termine
* @param {Function} onClick - funcion a llamar al pulsar el boton
* @param {Boolean} single - true si se puede volver a interactuar con el elemento, false en caso contrario
*/
function buttonInteractionComplete(button, anim, onClick, single) {
    anim.on("complete", () => {
        if (!single) {
            button.setInteractive();
        }

        if (onClick != null && typeof onClick == "function") {
            onClick();
        }
    });
}

/**
* Anadir animacion de cambio de color al pasar y quitar el raton por encima
* @param {Phaser.GameObject} button - elemento que reaccionara a los eventos del raton
* @param {Phaser.GameObject, Array} targets - objetos que cambiar de color 
* @param {Function} onClick - funcion a llamar al pulsar el boton
* @param {Boolean} overrideOnClick - true si se quieren sustituir todos los callbacks que tuviera el objeto en su evento pointerdown, false en caso contrario 
* @param {Boolean} single - true si se puede volver a interactuar con el elemento, false en caso contrario
* @param {Number} scaleFactor - factor para disminuir o aumentar la escala del boton al pasar el puntero por encima
* @param {Boolean} smooth - si la animacion es progresiva o inmediata
* @param {Number} duration - tiempo que dura la animacino
*/
export function growAnimation(button, targets, onClick = () => { }, overrideOnClick = false, single = false, scaleFactor = 1.1, smooth = true, duration = 20) {
    prepareButtonInteraction(button, overrideOnClick);

    let originalScale = button.scale;
    let growDuration = smooth ? duration : 0;

    // Al pasar el raton por encima del icono, se hace mas grande
    button.on("pointerover", () => {
        button.scene.tweens.add({
            targets: targets,
            scale: originalScale * scaleFactor,
            duration: growDuration,
            repeat: 0,
        });
    });
    // Al quitar el raton de encima vuelve a su tamano original
    button.on("pointerout", () => {
        button.scene.tweens.add({
            targets: targets,
            scale: originalScale,
            duration: growDuration,
            repeat: 0,
        });
    });
    // Al pulsar, se hace pequeno y grande de nuevo y se activa/desactiva el telefono
    button.on("pointerdown", () => {
        button.disableInteractive();
        let anim = button.scene.tweens.add({
            targets: targets,
            scale: originalScale,
            duration: duration,
            repeat: 0,
            yoyo: true
        });

        // Al terminar la animacion se ejecucta el onClick
        buttonInteractionComplete(button, anim, onClick, single);
    });
}


/**
* Anadir animacion de cambio de color al pasar y quitar el raton por encima
* @param {Phaser.GameObject} button - elemento que reaccionara a los eventos del raton
* @param {Phaser.GameObject, Array} targets - objetos que cambiar de color 
* @param {Function} onClick - funcion a llamar al pulsar el boton
* @param {Boolean} overrideOnClick - true si se quieren sustituir todos los callbacks que tuviera el objeto en su evento pointerdown, false en caso contrario 
* @param {Boolean} single - true si se puede volver a interactuar con el elemento, false en caso contrario
* @param {Number} normalTintColor - valor hex del color normal (opcional)
* @param {Number} hoverTintColor - valor hex del color al pasar el puntero por encima (opcional)
* @param {Number} pressingTintColor - valor hex del color al pulsar el boton (opcional)
* @param {Number} duration - tiempo que dura la animacino
*/
export function tintAnimation(button, targets, onClick = () => { }, overrideOnClick = false, single = false, normalTintColor = 0xffffff, hoverTintColor = 0xd9d9d9, pressingTintColor = 0x969696, duration = 50) {
    prepareButtonInteraction(button, overrideOnClick);

    let normalTint = hexToColor(normalTintColor);
    let hoverTint = hexToColor(hoverTintColor);
    let pressingTint = hexToColor(pressingTintColor);

    Phaser.Actions.SetTint(targets, normalTintColor);

    button.on("pointerover", () => {
        button.scene.tweens.addCounter({
            targets: button,
            from: 0,
            to: 100,
            onUpdate: (tween) => {
                const value = tween.getValue();
                let col = Phaser.Display.Color.Interpolate.ColorWithColor(normalTint, hoverTint, 100, value);
                let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                Phaser.Actions.SetTint(targets, colInt);
            },
            duration: duration,
            repeat: 0,
        });
    });
    button.on("pointerout", () => {
        button.scene.tweens.addCounter({
            targets: button,
            from: 0,
            to: 100,
            onUpdate: (tween) => {
                const value = tween.getValue();
                let col = Phaser.Display.Color.Interpolate.ColorWithColor(hoverTint, normalTint, 100, value);
                let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                Phaser.Actions.SetTint(targets, colInt);
            },
            duration: duration,
            repeat: 0,
        });
    });

    button.on("pointerdown", () => {
        button.disableInteractive();
        let anim = button.scene.tweens.addCounter({
            targets: button,
            from: 0,
            to: 100,
            onUpdate: (tween) => {
                const value = tween.getValue();
                let col = Phaser.Display.Color.Interpolate.ColorWithColor(hoverTint, pressingTint, 100, value);
                let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                Phaser.Actions.SetTint(targets, colInt);
            },
            duration: duration,
            repeat: 0,
            yoyo: true
        });

        // Al terminar la animacion se ejecucta el onClick
        buttonInteractionComplete(button, anim, onClick, single);
    });
}