import { database, changePanel, addAccount, accountSelect, t } from '../utils.js';

/**
 * Initialise les fonctionnalités supplémentaires du launcher
 * @async
 * @function initOthers
 * @param {Object} database - L'instance de la base de données
 * @param {Object} config - La configuration du launcher
 * @returns {Promise<void>}
 */
export async function initOthers(database, config) {
    const uuid = (await database.get('1234', 'accounts-selected'))?.value;
    if (!uuid || !uuid.selected) {
        console.error("No selected account found.");
        return;
    }

    const account = (await database.get(uuid.selected, 'accounts'))?.value;
    if (!account) {
        console.error("Account data is missing or invalid.");
        return;
    }

    const tooltip = document.querySelector('.player-head .player-tooltip');
    if (tooltip) {
        tooltip.innerHTML = ''; // Clear existing content
    }

    updateRole(account, config); // Update grade
    updateMoney(account, config); // Update points
    updateWhitelist(account, config); // Update play button state
    updateBackground(account, config); // Update background
}

/**
 * Met à jour l'affichage du rôle du joueur
 * @function updateRole
 * @param {Object} account - Les données du compte
 * @param {Object} config - La configuration du launcher
 * @returns {void}
 */
export function updateRole(account, config) {
    if (config.role && account.user_info.role) {
        const tooltip = document.querySelector('.player-head .player-tooltip');
        if (tooltip) {
            const blockRole = document.createElement("div");
            blockRole.classList.add("player-role");
            blockRole.textContent = `${t('grade')}: ${account.user_info.role.name}`;
            tooltip.appendChild(blockRole);
        }
    }
}

/**
 * Met à jour l'affichage de la monnaie du joueur
 * @function updateMoney
 * @param {Object} account - Les données du compte
 * @param {Object} config - La configuration du launcher
 * @returns {void}
 */
export function updateMoney(account, config) {
    if (config.money) {
        const tooltip = document.querySelector('.player-head .player-tooltip');
        if (tooltip) {
            const blockMonnaie = document.createElement("div");
            blockMonnaie.classList.add("player-monnaie");
            blockMonnaie.textContent = `${account.user_info.monnaie} pts`;
            tooltip.appendChild(blockMonnaie);
        }
    }
}

/**
 * Met à jour l'état du bouton de jeu en fonction de la whitelist
 * @function updateWhitelist
 * @param {Object} account - Les données du compte
 * @param {Object} config - La configuration du launcher
 * @returns {void}
 */
export function updateWhitelist(account, config) {
    const playBtn = document.querySelector(".play-btn");
    if (config.whitelist_activate && 
        (!config.whitelist.includes(account.name) &&
         !config.whitelist_roles.includes(account.user_info.role.name))) {
        playBtn.style.backgroundColor = "#696969";
        playBtn.style.pointerEvents = "none";
        playBtn.style.boxShadow = "none";
        playBtn.textContent = t('unavailable');
    } else {
        playBtn.style.backgroundColor = "#00bd7a";
        playBtn.style.pointerEvents = "auto";
        playBtn.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
        playBtn.textContent = t('play');
    }
}

/**
 * Met à jour l'arrière-plan en fonction du rôle du joueur
 * @function updateBackground
 * @param {Object} account - Les données du compte
 * @param {Object} config - La configuration du launcher
 * @returns {void}
 */
export function updateBackground(account, config) {
    document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
    document.body.style.backgroundSize = 'cover';

    if (config.role_data) {
        for (const roleKey in config.role_data) {
            if (config.role_data.hasOwnProperty(roleKey)) {
                const role = config.role_data[roleKey];
                if (account.user_info.role.name === role.name) {
                    const backgroundUrl = role.background;
                    const urlPattern = /^(https?:\/\/)/;
                    document.body.style.background = urlPattern.test(backgroundUrl) 
                        ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundUrl}) black no-repeat center center scroll`
                        : `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll `;
                    document.body.style.backgroundSize = 'cover';
                    break;
                }
            }
        }
    }
}
