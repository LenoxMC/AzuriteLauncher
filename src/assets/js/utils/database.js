/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

/**
 * Classe gérant la base de données IndexedDB du launcher
 * @class database
 */
class database {
    /**
     * Initialise la base de données et crée les stores nécessaires
     * @async
     * @method init
     * @returns {Promise<database>} L'instance de la base de données
     */
    async init() {
        this.db = await new Promise((resolve) => {
            let request = indexedDB.open('database', 1);

            request.onupgradeneeded = (event) => {
                let db = event.target.result;

                if (!db.objectStoreNames.contains('accounts')) {
                    db.createObjectStore('accounts', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('accounts-selected')) {
                    db.createObjectStore('accounts-selected', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('java-path')) {
                    db.createObjectStore('java-path', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('java-args')) {
                    db.createObjectStore('java-args', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('launcher')) {
                    db.createObjectStore('launcher', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('profile')) {
                    db.createObjectStore('profile', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('ram')) {
                    db.createObjectStore('ram', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('screen')) {
                    db.createObjectStore('screen', { keyPath: "key" });
                }
            }

            request.onsuccess = (event) => {
                resolve(event.target.result);
            }
        });
        return this;
    }

    /**
     * Ajoute une entrée dans la base de données
     * @method add
     * @param {Object} data - Les données à ajouter
     * @param {string} type - Le type de store à utiliser
     * @returns {IDBRequest} La requête d'ajout
     */
    add(data, type) {
        let store = this.getStore(type);
        return store.add({ key: this.genKey(data.uuid), value: data });
    }

    /**
     * Récupère une entrée de la base de données
     * @method get
     * @param {string} keys - La clé de l'entrée à récupérer
     * @param {string} type - Le type de store à utiliser
     * @returns {Promise<Object>} Les données récupérées
     */
    get(keys, type) {
        let store = this.getStore(type);
        let Key = this.genKey(keys);
        return new Promise((resolve) => {
            let get = store.get(Key);
            get.onsuccess = (event) => {
                resolve(event.target.result);
            }
        });
    }

    /**
     * Récupère toutes les entrées d'un store
     * @method getAll
     * @param {string} type - Le type de store à utiliser
     * @returns {Promise<Array>} Toutes les entrées du store
     */
    getAll(type) {
        let store = this.getStore(type);
        return new Promise((resolve) => {
            let getAll = store.getAll();
            getAll.onsuccess = (event) => {
                resolve(event.target.result);
            }
        });
    }

    /**
     * Met à jour une entrée dans la base de données
     * @method update
     * @param {Object} data - Les nouvelles données
     * @param {string} type - Le type de store à utiliser
     * @returns {Promise<IDBRequest>} La requête de mise à jour
     */
    update(data, type) {
        let self = this;
        return new Promise(async(resolve) => {
            let store = self.getStore(type);
            let keyCursor = store.openCursor(self.genKey(data.uuid));
            keyCursor.onsuccess = async(event) => {
                let cursor = event.target.result;
                for (let [key, value] of Object.entries({ value: data })) cursor.value[key] = value;
                resolve(cursor.update(cursor.value));
            }
        });
    }

    /**
     * Supprime une entrée de la base de données
     * @method delete
     * @param {string} key - La clé de l'entrée à supprimer
     * @param {string} type - Le type de store à utiliser
     * @returns {IDBRequest} La requête de suppression
     */
    delete(key, type) {
        let store = this.getStore(type);
        return store.delete(this.genKey(key));
    }

    /**
     * Récupère un store de la base de données
     * @method getStore
     * @param {string} type - Le type de store à récupérer
     * @returns {IDBObjectStore} Le store demandé
     */
    getStore(type) {
        return this.db.transaction(type, "readwrite").objectStore(type);
    }

    /**
     * Génère une clé unique à partir d'une chaîne de caractères
     * @method genKey
     * @param {string} int - La chaîne à convertir en clé
     * @returns {number} La clé générée
     */
    genKey(int) {
        var key = 0;
        for (let c of int.split("")) key = (((key << 5) - key) + c.charCodeAt()) & 0xFFFFFFFF;
        return key;
    }
}

export default database;