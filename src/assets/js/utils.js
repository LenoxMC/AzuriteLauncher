/**
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import slider from './utils/slider.js';
const pkg = require('../package.json');
const fs = require('fs');
const path = require('path');

let translations = {};
const systemLanguage = navigator.language.split('-')[0] || 'en';

/**
 * Charge les traductions depuis le fichier de langue approprié
 * @function loadTranslations
 * @returns {void}
 */
function loadTranslations() {
    const translationPath = path.join(__dirname, `./assets/translations/${systemLanguage}.json`);
    if (fs.existsSync(translationPath)) {
        translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
    } else {
        console.error(`Translation file for language "${systemLanguage}" not found. Falling back to English.`);
        const fallbackPath = path.join(__dirname, './assets/translations/en.json');
        if (fs.existsSync(fallbackPath)) {
            translations = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        }
    }
}

/**
 * Récupère la traduction pour une clé donnée
 * @function t
 * @param {string} key - La clé de traduction
 * @returns {string} La traduction ou la clé si aucune traduction n'est trouvée
 */
function t(key) {
    return translations[key] || key;
}

loadTranslations();

const settings_url = pkg.user ? `${pkg.settings}/${pkg.user}` : pkg.settings;

export {
    config,
    database,
    logger,
    changePanel,
    addAccount,
    slider as Slider,
    accountSelect,
    t,
    headplayer
};

/**
 * Change le panneau actif dans l'interface
 * @function changePanel
 * @param {string} id - L'identifiant du panneau à activer
 * @returns {void}
 */
function changePanel(id) {
    const panel = document.querySelector(`.${id}`);
    const active = document.querySelector(`.active`);
    if (active) active.classList.toggle("active");
    panel.classList.add("active");
}

/**
 * Ajoute un nouveau compte à l'interface
 * @function addAccount
 * @param {Object} data - Les données du compte
 * @param {string} data.uuid - L'UUID du compte
 * @param {string} data.name - Le nom du compte
 * @returns {void}
 */
function addAccount(data) {
    const azauth = getAzAuthUrl();
    const timestamp = new Date().getTime();
    const div = document.createElement("div");
    div.classList.add("account");
    div.id = data.uuid;
    div.innerHTML = `
        <img class="account-image" src="${azauth}api/skin-api/avatars/face/${data.name}/?t=${timestamp}">
        <div class="account-name">${data.name}</div>
        <div class="account-uuid">${data.uuid}</div>
        <div class="account-delete"><div class="icon-account-delete icon-account-delete-btn"></div></div>
    `;
    document.querySelector('.accounts').appendChild(div);
}

/**
 * Sélectionne un compte et met à jour l'interface
 * @function accountSelect
 * @param {string} uuid - L'UUID du compte à sélectionner
 * @returns {void}
 */
function accountSelect(uuid) {
    const account = document.getElementById(uuid);
    const pseudo = account.querySelector('.account-name').innerText;
    const activeAccount = document.querySelector('.active-account');

    if (activeAccount) activeAccount.classList.toggle('active-account');
    account.classList.add('active-account');
    headplayer(pseudo);
}

/**
 * Met à jour l'image de la tête du joueur
 * @function headplayer
 * @param {string} pseudo - Le pseudo du joueur
 * @returns {void}
 */
function headplayer(pseudo) {
    const azauth = getAzAuthUrl();
    const timestamp = new Date().getTime();
    const skin_url = `${azauth}api/skin-api/avatars/face/${pseudo}/?t=${timestamp}`;
    document.querySelector(".player-head").style.backgroundImage = `url(${skin_url})`;
}

/**
 * Récupère l'URL de base pour AzAuth
 * @function getAzAuthUrl
 * @returns {string} L'URL de base pour AzAuth
 */
function getAzAuthUrl() {
    const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
    return pkg.env === 'azuriom' 
        ? baseUrl 
        : config.config.azauth.endsWith('/') 
        ? config.config.azauth 
        : `${config.config.azauth}/`;
}
