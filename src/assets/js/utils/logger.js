/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

let console_log = console.log;
let console_info = console.info;
let console_warn = console.warn;
let console_debug = console.debug;
let console_error = console.error;

/**
 * Classe gérant le système de logs personnalisé
 * @class logger
 */
class logger {
    /**
     * Crée une nouvelle instance de logger
     * @constructor
     * @param {string} name - Le nom du logger
     * @param {string} color - La couleur des logs
     */
    constructor(name, color) {
        this.Logger(name, color)
    }

    /**
     * Configure le système de logs avec un nom et une couleur
     * @async
     * @method Logger
     * @param {string} name - Le nom du logger
     * @param {string} color - La couleur des logs
     * @returns {Promise<void>}
     */
    async Logger(name, color) {
        console.log = (value) => {
            console_log.call(console, `%c[${name}]:`, `color: ${color};`, value);
        };

        console.info = (value) => {
            console_info.call(console, `%c[${name}]:`, `color: ${color};`, value);
        };

        console.warn = (value) => {
            console_warn.call(console, `%c[${name}]:`, `color: ${color};`, value);
        };

        console.debug = (value) => {
            console_debug.call(console, `%c[${name}]:`, `color: ${color};`, value);
        };

        console.error = (value) => {
            console_error.call(console, `%c[${name}]:`, `color: ${color};`, value);
        };
    }
}

export default logger;