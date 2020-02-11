/**
 * The checkbox changed event handler.
 * @param {Object} _event 
 */
function option_checkbox_changed(_event) {
    setting_set(this.id, this.checked);
}

function init() {
    document.querySelectorAll("input[type='checkbox']").forEach(function (element) {
        setting_get(element.id)
            .then(function (data) {
                let checked = data[element.id];
                if (typeof (checked) === "undefined") {
                    checked = true;
                }
                element.checked = checked;
            })
            .catch(function () {
                element.checked = true;
            })
            .finally(function () {
                element.addEventListener("change", option_checkbox_changed);
            });
    });
}

window.addEventListener("load", init);
