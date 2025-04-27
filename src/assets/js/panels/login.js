/**
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

import { database, changePanel, addAccount, accountSelect, t } from '../utils.js';
import { initOthers } from '../utils/sharedFunctions.js';
const { AZauth } = require('minecraft-java-core-azbetter');
const { ipcRenderer, shell } = require('electron');
const pkg = require('../package.json');
const settings_url = pkg.user ? `${pkg.settings}/${pkg.user}` : pkg.settings;

/**
 * Classe gérant le panneau de connexion du launcher
 * @class Login
 */
class Login {
    /** @type {string} L'identifiant du panneau */
    static id = "login";

    /**
     * Initialise le panneau de connexion
     * @async
     * @method init
     * @param {Object} config - La configuration du launcher
     * @returns {Promise<void>}
     */
    async init(config) {
        this.config = config;
        this.database = await new database().init();
        this.setStaticTexts();
        await this.updateCancelButtonVisibility();
        this.config.online ? this.getOnline() : this.getOffline();
    }

    /**
     * Met à jour la visibilité du bouton d'annulation en fonction du nombre de comptes
     * @async
     * @method updateCancelButtonVisibility
     * @returns {Promise<void>}
     */
    async updateCancelButtonVisibility() {
        const accounts = await this.database.getAll('accounts');
        const cancelButtons = document.querySelectorAll('.cancel');
        cancelButtons.forEach(button => {
            button.style.display = accounts.length > 0 ? 'block' : 'none';
        });
    }

    /**
     * Définit les textes statiques du panneau
     * @method setStaticTexts
     * @returns {void}
     */
    setStaticTexts() {
        document.getElementById('a2f-label').textContent = t('2fa_enabled');
        document.getElementById('a2f-login-btn').textContent = t('play');
        document.getElementById('cancel-a2f-btn').textContent = t('cancel');
        document.getElementById('email-verify-label').textContent = t('verify_email');
        document.getElementById('cancel-email-btn').textContent = t('cancel');
        document.getElementById('username-label').textContent = t('username');
        document.getElementById('password-label').textContent = t('password');
        document.getElementById('login-btn').textContent = t('play');
        document.getElementById('cancel-mojang-btn').textContent = t('cancel');
        document.getElementById('password-reset-link').textContent = t('forgot_password');
        document.getElementById('new-user-link').textContent = t('no_account');
    }

    /**
     * Rafraîchit les données du panneau
     * @async
     * @method refreshData
     * @returns {Promise<void>}
     */
    async refreshData() {
        document.querySelector('.player-role').innerHTML = '';
        document.querySelector('.player-monnaie').innerHTML = '';
        await this.initOthers();
        await this.initPreviewSkin();
    }

    /**
     * Initialise l'aperçu du skin du joueur
     * @async
     * @method initPreviewSkin
     * @returns {Promise<void>}
     */
    async initPreviewSkin() {
        console.log('initPreviewSkin called');
        const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
        const websiteUrl = pkg.env === 'azuriom' ? `${baseUrl}` : this.config.azauth;
        const uuid = (await this.database.get('1234', 'accounts-selected')).value;
        const account = (await this.database.get(uuid.selected, 'accounts')).value;

        document.querySelector('.player-skin-title').innerHTML = `${t('skin_of')} ${account.name}`;
        document.querySelector('.skin-renderer-settings').src = `${websiteUrl}skin3d/3d-api/skin-api/${account.name}/300/400`;  
    }

    /**
     * Initialise les fonctionnalités supplémentaires
     * @async
     * @method initOthers
     * @returns {Promise<void>}
     */
    async initOthers() {
        await initOthers(this.database, this.config);
    }

    /**
     * Initialise le mode de connexion en ligne
     * @method getOnline
     * @returns {void}
     */
    getOnline() {
        console.log(`Initializing Az Panel...`);
        this.loginAzAuth();
        document.querySelector('.cancel-mojang').addEventListener("click", () => {
            changePanel("settings");
        });
    }

    /**
     * Gère la connexion via AzAuth
     * @async
     * @method loginAzAuth
     * @returns {Promise<void>}
     */
    async loginAzAuth() {
        const elements = this.getElements();
        const azauth = this.getAzAuthUrl();

        this.setupExternalLinks(azauth);
        this.setupEventListeners(elements, azauth);
    }

    /**
     * Récupère les éléments du DOM nécessaires
     * @method getElements
     * @returns {Object} Les éléments du DOM
     */
    getElements() {
        return {
            mailInput: document.querySelector('.Mail'),
            passwordInput: document.querySelector('.Password'),
            cancelMojangBtn: document.querySelector('.cancel-mojang'),
            infoLogin: document.querySelector('.info-login'),
            loginBtn: document.querySelector(".login-btn"),
            loginBtn2f: document.querySelector('.login-btn-2f'),
            a2finput: document.querySelector('.a2f'),
            infoLogin2f: document.querySelector('.info-login-2f'),
            cancel2f: document.querySelector('.cancel-2f'),
            infoLoginEmail: document.querySelector('.info-login-email'),
            cancelEmail: document.querySelector('.cancel-email')
        };
    }

    /**
     * Récupère l'URL de base pour AzAuth
     * @method getAzAuthUrl
     * @returns {string} L'URL de base
     */
    getAzAuthUrl() {
        const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
        return pkg.env === 'azuriom' 
            ? baseUrl 
            : this.config.azauth.endsWith('/') 
            ? this.config.azauth 
            : `${this.config.azauth}/`;
    }

    /**
     * Configure les liens externes
     * @method setupExternalLinks
     * @param {string} azauth - L'URL de base d'AzAuth
     * @returns {void}
     */
    setupExternalLinks(azauth) {
        const newuserurl = `${azauth}user/register`;
        const passwordreseturl = `${azauth}user/password/reset`;

        this.newuser = document.querySelector(".new-user");
        this.newuser.innerHTML = t('no_account');
        this.newuser.addEventListener('click', () => shell.openExternal(newuserurl));

        this.passwordreset = document.querySelector(".password-reset");
        this.passwordreset.innerHTML = t('forgot_password');
        this.passwordreset.addEventListener('click', () => shell.openExternal(passwordreseturl));
    }

    /**
     * Configure les écouteurs d'événements
     * @method setupEventListeners
     * @param {Object} elements - Les éléments du DOM
     * @param {string} azauth - L'URL de base d'AzAuth
     * @returns {void}
     */
    setupEventListeners(elements, azauth) {
        elements.cancelMojangBtn.addEventListener("click", () => this.toggleLoginCards("default"));
        elements.cancel2f.addEventListener("click", () => this.resetLoginForm(elements));
        elements.cancelEmail.addEventListener("click", () => this.resetLoginForm(elements));

        elements.loginBtn2f.addEventListener("click", async () => {
            elements.infoLogin2f.innerHTML = t('connecting');
            if (elements.a2finput.value === "") {
                elements.infoLogin2f.innerHTML = t('enter_2fa_code');
                return;
            }
            await this.handleLogin(elements, azauth, elements.a2finput.value);
        });

        elements.loginBtn.addEventListener("click", async () => {
            elements.cancelMojangBtn.disabled = true;
            elements.loginBtn.disabled = true;
            elements.mailInput.disabled = true;
            elements.passwordInput.disabled = true;
            elements.infoLogin.innerHTML = t('connecting');

            if (elements.mailInput.value === "") {
                elements.infoLogin.innerHTML = t('enter_username');
                this.enableLoginForm(elements);
                return;
            }

            if (elements.passwordInput.value === "") {
                elements.infoLogin.innerHTML = t('enter_password');
                this.enableLoginForm(elements);
                return;
            }

            await this.handleLogin(elements, azauth);
        });
    }

    /**
     * Bascule entre les différents types de cartes de connexion
     * @method toggleLoginCards
     * @param {string} cardType - Le type de carte à afficher
     * @returns {void}
     */
    toggleLoginCards(cardType) {
        const loginCardMojang = document.querySelector(".login-card-mojang");
        const a2fCard = document.querySelector('.a2f-card');
        const emailVerifyCard = document.querySelector('.email-verify-card');

        loginCardMojang.style.display = cardType === "default" ? "block" : "none";
        a2fCard.style.display = cardType === "a2f"? "block" : "none";
        emailVerifyCard.style.display = cardType === "email"? "block" : "none";
    }

    /**
     * Réinitialise le formulaire de connexion
     * @method resetLoginForm
     * @param {Object} elements - Les éléments du DOM
     * @returns {void}
     */
    resetLoginForm(elements) {
        this.toggleLoginCards("default");
        elements.infoLogin.innerHTML = "";
        elements.infoLogin2f.innerHTML = "";
        elements.cancelMojangBtn.disabled = false;
        elements.mailInput.value = "";
        elements.loginBtn.disabled = false;
        elements.mailInput.disabled = false;
        elements.passwordInput.disabled = false;
        elements.passwordInput.value = "";
        elements.a2finput.value = "";
    }

    /**
     * Réactive le formulaire de connexion
     * @method enableLoginForm
     * @param {Object} elements - Les éléments du DOM
     * @returns {void}
     */
    enableLoginForm(elements) {
        elements.cancelMojangBtn.disabled = false;
        elements.loginBtn.disabled = false;
        elements.mailInput.disabled = false;
        elements.passwordInput.disabled = false;
    }

    /**
     * Gère le processus de connexion
     * @async
     * @method handleLogin
     * @param {Object} elements - Les éléments du DOM
     * @param {string} azauth - L'URL de base d'AzAuth
     * @param {string} [a2fCode] - Le code 2FA
     * @returns {Promise<void>}
     */
    async handleLogin(elements, azauth, a2fCode = null) {
        const azAuth = new AZauth(azauth);
        try {
            const account_connect = a2fCode 
                ? await azAuth.login(elements.mailInput.value, elements.passwordInput.value, a2fCode)
                : await azAuth.login(elements.mailInput.value, elements.passwordInput.value);

            if (account_connect.error) {
                if (account_connect.reason === 'user_banned') {
                    elements.infoLogin.innerHTML = t('account_banned');
                } else if (account_connect.reason === 'invalid_credentials') {
                    elements.infoLogin.innerHTML = t('invalid_credentials');
                } else if (account_connect.reason === 'invalid_2fa') {
                    elements.infoLogin2f.innerHTML = t('invalid_2fa_code');
                } else {
                    elements.infoLogin.innerHTML = t('error_occurred');
                    elements.infoLogin2f.innerHTML = t('error_occurred');
                }
                this.enableLoginForm(elements);
                return;
            }

            if (account_connect.A2F === true) {
                this.toggleLoginCards("a2f");
                elements.a2finput.value = "";
                elements.cancelMojangBtn.disabled = false;
                return;
            }

            if (this.config.email_verified && !account_connect.user_info.verified) {
                elements.infoLogin.innerHTML = t('verify_email');
                elements.infoLogin2f.innerHTML = t('verify_email');
                this.enableLoginForm(elements);
                return;
            }

            console.log(account_connect);

            const account = this.createAccountObject(account_connect);
            await this.saveAccount(account);
            this.resetLoginForm(elements);
            this.initOthers();
            elements.loginBtn.style.display = "block";
            elements.infoLogin.innerHTML = "&nbsp;";
        } catch (err) {
            console.error(err);
            elements.infoLogin.innerHTML = t('connection_error');
            this.enableLoginForm(elements);
        }
    }

    /**
     * Crée un objet compte à partir des données de connexion
     * @method createAccountObject
     * @param {Object} account_connect - Les données de connexion
     * @returns {Object} L'objet compte formaté
     */
    createAccountObject(account_connect) {
        return {
            access_token: account_connect.access_token,
            client_token: account_connect.uuid,
            uuid: account_connect.uuid,
            name: account_connect.name,
            user_properties: account_connect.user_properties,
            meta: {
                type: account_connect.meta.type,
                offline: true
            },
            user_info: {
                role: account_connect.user_info.role,
                monnaie: account_connect.user_info.money,
                verified: account_connect.user_info.verified,
            },
        };
    }

    /**
     * Sauvegarde le compte dans la base de données
     * @async
     * @method saveAccount
     * @param {Object} account - L'objet compte à sauvegarder
     * @returns {Promise<void>}
     */
    async saveAccount(account) {
        await this.database.add(account, 'accounts');
        await this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');
        addAccount(account);
        accountSelect(account.uuid);
        await this.updateCancelButtonVisibility();
        changePanel("home");
        this.refreshData();
    }
}

export default Login;
