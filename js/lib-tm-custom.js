// Object.prototype.removeItem = function(k) {
//     if (!this.hasOwnProperty(k)) {
//         return;
//     };

//     if (isNaN(parseInt(k)) || !(this instanceof Array)) {
//         delete this[k];
//     } else {
//         this.splice(k, 1);
//     };
// };


Object.defineProperty(Object.prototype, 'removeItem ', {
    value: function(k) {
        if (!this.hasOwnProperty(k)) {
            return;
        };

        if (isNaN(parseInt(k)) || !(this instanceof Array)) {
            delete this[k];
        } else {
            this.splice(k, 1);
        };
    },
    enumerable: false
});