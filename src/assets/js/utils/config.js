/**
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

const pkg = require('../package.json');
const fetch = require("node-fetch");
const convert = require("xml-js");

const settings_url = pkg.user ? `${pkg.settings}/${pkg.user}` : pkg.settings;

/**
 * Récupère l'URL de configuration
 * @function getConfigUrl
 * @returns {string} L'URL de configuration
 */
function getConfigUrl() {
    const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
    return pkg.env === 'azuriom' ? `${baseUrl}api/centralcorp/options` : `${baseUrl}utils/api`;
}

/**
 * Récupère l'URL de base pour AzAuth
 * @function getAzAuthUrl
 * @param {Object} config - La configuration actuelle
 * @returns {string} L'URL de base pour AzAuth
 */
function getAzAuthUrl(config) {
    const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
    return pkg.env === 'azuriom' ? baseUrl : config.azauth.endsWith('/') ? config.azauth : `${config.azauth}/`;
}

/**
 * Classe gérant la configuration du launcher
 * @class Config
 */
class Config {
    /**
     * Récupère la configuration du launcher
     * @async
     * @method GetConfig
     * @returns {Promise<Object>} La configuration du launcher
     */
    async GetConfig() {
        try {
            const response = await fetch(getConfigUrl());
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch config:", error);
            throw error;
        }
    }

    /**
     * Récupère les actualités du serveur
     * @async
     * @method GetNews
     * @returns {Promise<Array>} Les actualités formatées
     */
    async GetNews() {
        try {
            this.config = await this.GetConfig();
            const newsUrl = new URL('/api/rss', getAzAuthUrl(this.config));

            const rss = await fetch(newsUrl).then(res => res.text());
            const rssParsed = JSON.parse(convert.xml2json(rss, { compact: true }));
            const items = rssParsed.rss.channel.item;

            if (!items) {
                return [{
                    title: "Aucun article disponible",
                    content: "Aucun article n'a été trouvé.",
                    author: "",
                    publish_date: "2025"
                }];
            }

            return Array.isArray(items) ? items.map(this.parseNewsItem) : [this.parseNewsItem(items)];
        } catch (error) {
            console.error("Failed to fetch news:", error);
            throw error;
        }
    }

    /**
     * Parse un élément d'actualité RSS
     * @method parseNewsItem
     * @param {Object} item - L'élément RSS à parser
     * @returns {Object} L'élément d'actualité formaté
     */
    parseNewsItem(item) {
        return {
            title: item.title._text,
            content: item['content:encoded']._text,
            author: item['dc:creator']._text,
            publish_date: item.pubDate._text
        };
    }
}

export default new Config();
