/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
const { ipcRenderer } = require('electron');
import { config, t } from './utils.js';

let dev = process.env.NODE_ENV === 'dev';

/**
 * Classe gérant l'écran de démarrage du launcher
 * @class Splash
 */
class Splash {
    /**
     * Crée une nouvelle instance de Splash
     * @constructor
     */
    constructor() {
        this.splash = document.querySelector(".splash");
        this.splashMessage = document.querySelector(".splash-message");
        this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector("progress");
        document.addEventListener('DOMContentLoaded', () => this.startAnimation());
    }

    /**
     * Démarre l'animation de l'écran de démarrage
     * @async
     * @method startAnimation
     * @returns {Promise<void>}
     */
    async startAnimation() {
        config.GetConfig().then(res => {
            let splashes = [
                { "message": res.splash, "author": res.splash_author },
            ];
            let splash = splashes[Math.floor(Math.random() * splashes.length)];
        this.splashMessage.textContent = splash.message;
        this.splashAuthor.children[0].textContent = "@" + splash.author;
        })
        
        document.getElementById('splash-message').textContent = t('welcome_message');
        document.getElementById('splash-author').textContent = t('developed_by');
        document.getElementById('update-message').textContent = t('checking_updates');

        await sleep(100);
        document.querySelector("#splash").style.display = "block";
        await sleep(500);
        this.splash.classList.add("opacity");
        await sleep(500);
        this.splash.classList.add("translate");
        this.splashMessage.classList.add("opacity");
        this.splashAuthor.classList.add("opacity");
        this.message.classList.add("opacity");
        await sleep(1000);
        this.maintenanceCheck();
    }

    /**
     * Vérifie si le launcher est en maintenance
     * @async
     * @method maintenanceCheck
     * @returns {Promise<void>}
     */
    async maintenanceCheck() {
        if (dev) return this.startLauncher();
        config.GetConfig().then(res => {
            if (res.maintenance) return this.shutdown(res.maintenance_message);
            else this.checkUpdate();
        }).catch(e => {
            console.error(e);
            return this.shutdown("Aucune connexion internet détectée,<br>veuillez réessayer ultérieurement.");
        })
    }

    /**
     * Vérifie les mises à jour disponibles
     * @method checkUpdate
     * @returns {void}
     */
    async checkUpdate() {
        this.setStatus(`Recherche de mise à jour...`);
        ipcRenderer.send('update-app');

        ipcRenderer.on('updateAvailable', () => {
            this.setStatus(`Mise à jour disponible !`);
            this.toggleProgress();
            ipcRenderer.send('start-update');
        })

        ipcRenderer.on('download-progress', (event, progress) => {
            this.setProgress(progress.transferred, progress.total);
        })

        ipcRenderer.on('update-not-available', () => {
            this.startLauncher();
        })
    }

    /**
     * Démarre le launcher principal
     * @method startLauncher
     * @returns {void}
     */
    startLauncher() {
        this.setStatus(`Démarrage du launcher`);
        ipcRenderer.send('main-window-open');
        ipcRenderer.send('update-window-close');
    }

    /**
     * Arrête le launcher avec un message
     * @method shutdown
     * @param {string} text - Le message d'arrêt à afficher
     * @returns {void}
     */
    shutdown(text) {
        this.setStatus(`${text}<br>Arrêt dans 5s`);
        let i = 4;
        setInterval(() => {
            this.setStatus(`${text}<br>Arrêt dans ${i--}s`);
            if (i < 0) ipcRenderer.send('update-window-close');
        }, 1000);
    }

    /**
     * Met à jour le message de statut
     * @method setStatus
     * @param {string} text - Le texte à afficher
     * @returns {void}
     */
    setStatus(text) {
        this.message.innerHTML = text;
    }

    /**
     * Affiche ou masque la barre de progression
     * @method toggleProgress
     * @returns {void}
     */
    toggleProgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    /**
     * Met à jour la barre de progression
     * @method setProgress
     * @param {number} value - La valeur actuelle
     * @param {number} max - La valeur maximale
     * @returns {void}
     */
    setProgress(value, max) {
        this.progress.value = value;
        this.progress.max = max;
    }
}

/**
 * Fonction utilitaire pour créer un délai
 * @function sleep
 * @param {number} ms - Le nombre de millisecondes à attendre
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        ipcRenderer.send("update-window-dev-tools");
    }
})

new Splash();