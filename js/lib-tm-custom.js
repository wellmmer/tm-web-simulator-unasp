Object.prototype.removeItem = function(k) {
    if (!this.hasOwnProperty(k)) {
        return;
    };

    if (isNaN(parseInt(k)) || !(this instanceof Array)) {
        delete this[k];
    } else {
        this.splice(k, 1);
    };
};