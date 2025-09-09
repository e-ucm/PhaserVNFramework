import Singleton from "../utils/singleton.js";

export default class BaseTrackerManager extends Singleton {
    /**
    * Wrapper del tracker basado en el estandar xApi.
    * Centraliza la gestion y el envio de eventos desde cualquier parte
    */
    constructor() {
        super("TrackerManager");

        this.seriousGameTracker = null;
        this.gameTitle = null;
    }

    /**
    * Inicializa el tracker con una instancia del tracker y con el titulo del juego
    * @param {SeriousGameTracker} seriousGameTracker 
    * @param {String} gameTitle 
    */
    init(seriousGameTracker, gameTitle) {
        this.seriousGameTracker = seriousGameTracker;
        this.gameTitle = gameTitle;
    }

    sendInitializeDialog(name, dialog) {
        // \s+ --> encuentra uno o mas espacios en blanco
        // /g --> encuentra todas las coincidencias en el string en vez de pararse en la primera
        this.seriousGameTracker.completable(`${name} ${dialog.replace(/\s+/g, ' ').trim()}`, this.seriousGameTracker.COMPLETABLETYPE.STORYNODE)
            .initialized()
            .send();
    }

    sendCompleteDialog(name, dialog) {
        // \s+ --> encuentra uno o mas espacios en blanco
        // /g --> encuentra todas las coincidencias en el string en vez de pararse en la primera
        this.seriousGameTracker.completable(`${name} ${dialog.replace(/\s+/g, ' ').trim()}`, this.seriousGameTracker.COMPLETABLETYPE.STORYNODE)
            .completed(true, true, 1)
            .send();
    }

    sendSelectChoice(id, response) {
        this.seriousGameTracker.alternative(id, this.seriousGameTracker.ALTERNATIVETYPE.DIALOG)
            .selected(response)
            .send();
    }

    sendInitializeScene(sceneKey) {
        this.seriousGameTracker.accessible(sceneKey, this.seriousGameTracker.ACCESSIBLETYPE.SCREEN)
            .accessed()
            .send();

        this.seriousGameTracker.completable(sceneKey, this.seriousGameTracker.COMPLETABLETYPE.COMPLETABLE)
            .initialized()
            .send();
    }

    sendCompleteScene(sceneKey) {
        this.seriousGameTracker.completable(sceneKey, this.seriousGameTracker.COMPLETABLETYPE.COMPLETABLE)
            .completed(true, true, 1)
            .send();
    }

    sendAccessCutscene(sceneKey) {
        this.seriousGameTracker.accessible(sceneKey, this.seriousGameTracker.ACCESSIBLETYPE.SCREEN)
            .accessed()
            .send();
    }

    sendInteractGameObject(id, npc = false, extensions = {}) {
        let type = this.seriousGameTracker.GAMEOBJECTTYPE.ITEM;
        if (npc) {
            type = this.seriousGameTracker.GAMEOBJECTTYPE.NPC;
        }
        this.seriousGameTracker.gameObject(id, type)
            .interacted()
            .withResultExtensions(extensions)
            .send();
    }

    sendSelectMenuOption(id, response, extensions = {}) {
        this.seriousGameTracker.alternative(id, this.seriousGameTracker.ALTERNATIVETYPE.MENU)
            .selected(response)
            .withResultExtensions(extensions)
            .send();
    }

    sendSelectLanguage(language) {
        this.sendSelectMenuOption("language", language);
    }

    async sendInitializeGame() {
        await this.seriousGameTracker.completable(this.gameTitle, this.seriousGameTracker.COMPLETABLETYPE.GAME)
            .initialized()
            .send();
        await this.seriousGameTracker.flush();
    }

    async sendProgressGame(progress, extensions = {}) {
        await this.seriousGameTracker.completable(this.gameTitle, this.seriousGameTracker.COMPLETABLETYPE.GAME)
            .progressed(progress)
            .withResultExtensions(extensions)
            .send();
        await this.seriousGameTracker.flush();
    }

    async sendCompleteGame(completion) {
        await this.seriousGameTracker.completable(this.gameTitle, this.seriousGameTracker.COMPLETABLETYPE.GAME)
            .completed(completion, true, 1)
            .send();
        await this.seriousGameTracker.flush({ withBackup: true });
    }
}