/**
 * Sets the key/value pair in local storage.
 * @param {string} key 
 * @param {string} value 
 * @returns {Promise}
 */
function setting_set(key, value) {
    return browser.storage.local.set({ [key]: value });
}

/**
 * Returns a Promise containing the requested value.
 * @param {string} key 
 * @returns {Promise}
 */
function setting_get(key) {
    return browser.storage.local.get(key);
}

