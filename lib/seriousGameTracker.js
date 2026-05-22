export default async function createSeriousGameTracker(gameTitle) {
    console.log("Initializing SeriousGameTracker...");
    console.log(`Game Title: ${gameTitle}`);
    let seriousGameTracker = new SeriousGameTracker();
    seriousGameTracker.trackerSettings.default_uri=`${window.location.origin}${window.location.pathname}/`, // Base URL for xAPI statements (can be customized or set via URL params)
    seriousGameTracker.trackerSettings.generateSettingsFromURLParams = true;
    await seriousGameTracker.login();
    seriousGameTracker.start();
    return seriousGameTracker;
}