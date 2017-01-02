// polyfill ISO Date format parser for IE8

Date.now = Date.now || function() {
    return +new Date;
};

(function() {
    var D = new Date('2011-06-02T09:34:29+02:00');
    if (!D || +D !== 1307000069000) {
        Date.fromISO = function(s) {
            var day, tz, rx = /^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/, p = rx.exec(s) || [];
            if (p[1]) {
                day = p[1].split(/\D/);
                for (var i = 0, L = day.length; i < L; i++) {
                    day[i] = parseInt(day[i], 10) || 0;
                }
                day[1] -= 1;
                day = new Date(Date.UTC.apply(Date, day));
                if (!day.getDate())
                    return NaN;
                if (p[5]) {
                    tz = (parseInt(p[5], 10) * 60);
                    if (p[6])
                        tz += parseInt(p[6], 10);
                    if (p[4] == '+')
                        tz *= -1;
                    if (tz)
                        day.setUTCMinutes(day.getUTCMinutes() + tz);
                }
                return day;
            }
            return NaN;
        };
    } else {
        Date.fromISO = function(s) {
            return new Date(s);
        };
    }
})();

(function() {
    var d = new Date();
    if (d.toLocaleDateString('en-US', {}).match(/^[0-9]/)) {
        Date.prototype.formatLocaleDateString = function(locale, options) {
            return this.toLocaleDateString(locale, options);
        };
    } else {
        var dateFormats = {
            "en-US" : "{1}/{2}/{0}",
            "en-GB" : "{2}/{1}/{0}",
            "ja-JP" : "{0}/{1}/{2}"
        };
        Date.prototype.formatLocaleDateString = function(locale, options) {
            var yyyy = this.getFullYear();
            var mm = this.getMonth() + 1;
            var dd = this.getDate();
            var df = dateFormats[locale];
            if (df === undefined) {
                df = dateFormats["en-US"];
            }
            return df.format(yyyy, mm, dd);
        };
    }
})();

// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {

        var k;

        // 1. Let O be the result of calling ToObject passing
        // the this value as the argument.
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get
        // internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If len is 0, return -1.
        if (len === 0) {
            return -1;
        }

        // 5. If argument fromIndex was passed let n be
        // ToInteger(fromIndex); else let n be 0.
        var n = +fromIndex || 0;

        if (Math.abs(n) === Infinity) {
            n = 0;
        }

        // 6. If n >= len, return -1.
        if (n >= len) {
            return -1;
        }

        // 7. If n >= 0, then Let k be n.
        // 8. Else, n<0, Let k be len - abs(n).
        // If k is less than 0, then let k be 0.
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        // 9. Repeat, while k < len
        while (k < len) {
            var kValue;
            // a. Let Pk be ToString(k).
            // This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the
            // HasProperty internal method of O with argument Pk.
            // This step can be combined with c
            // c. If kPresent is true, then
            // i. Let elementK be the result of calling the Get
            // internal method of O with the argument ToString(k).
            // ii. Let same be the result of applying the
            // Strict Equality Comparison Algorithm to
            // searchElement and elementK.
            // iii. If same is true, return k.
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

if (!Array.prototype.map) {
    Array.prototype.map = function(fun /* , thisArg */) {
        "use strict";

        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function")
            throw new TypeError();

        var res = new Array(len);
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            // NOTE: Absolute correctness would demand Object.defineProperty
            // be used. But this method is fairly new, and failure is
            // possible only if Object.prototype or Array.prototype
            // has a property |i| (very unlikely), so use a less-correct
            // but more portable alternative.
            if (i in t)
                res[i] = fun.call(thisArg, t[i], i, t);
        }

        return res;
    };
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun /* , thisArg */) {
        "use strict";

        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function")
            throw new TypeError();

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t)
                fun.call(thisArg, t[i], i, t);
        }
    };
}

if (!Date.prototype.toISOString) {

    (function() {

        function pad(number) {
            var r = String(number);
            if (r.length === 1) {
                r = '0' + r;
            }
            return r;
        }

        Date.prototype.toISOString = function() {
            return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':'
                + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.'
                + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) + 'Z';
        };

    }());
}
