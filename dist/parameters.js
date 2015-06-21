/// <reference path='./../typings/node/node.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * The {{#crossLink "ParameterAbstract"}}{{/crossLink}} Dynamic parameter abstract
 *
 * @class ParameterAbstract
 * @constructor
 **/
var ParameterAbstract = (function () {
    function ParameterAbstract() {
    }
    /**
     * Get value for parameter
     *
     * @method getValue
     * @param results {any[]}
     * @returns {any}
     * @public
     */
    ParameterAbstract.prototype.getValue = function (results) {
        throw new Error('This method is abstract');
    };
    return ParameterAbstract;
})();
exports.ParameterAbstract = ParameterAbstract;
/**
 * The {{#crossLink "ParameterResult"}}{{/crossLink}} Dynamic parameter from result data
 *
 * @class ParameterResult
 * @extends ParameterAbstract
 * @param index {number}
 * @param ...keys {any[]}
 * @constructor
 **/
var ParameterResult = (function (_super) {
    __extends(ParameterResult, _super);
    function ParameterResult(index, key1, key2) {
        _super.call(this);
        this.index = index;
        this.key1 = key1;
        this.key2 = key2;
    }
    /**
     * Get value for parameter
     *
     * @method getValue
     * @param results {any[]}
     * @returns {any}
     * @public
     */
    ParameterResult.prototype.getValue = function (results) {
        if (typeof results[this.index] === 'undefined') {
            throw new Error('not found result data for index: ' + this.index.toString());
        }
        if (typeof results[this.index][this.key1] === 'undefined') {
            throw new Error('not found result data in key: ' + this.key1 + ' for index: ' + this.index.toString());
        }
        if (typeof this.key2 !== 'undefined') {
            if (typeof results[this.index][this.key1][this.key2] === 'undefined') {
                throw new Error('not found result data in key: ' + this.key1
                    + ' and second key: ' + this.key2 + ' for index: ' + this.index.toString());
            }
            return this.format(results[this.index][this.key1][this.key2]);
        }
        return this.format(results[this.index][this.key1]);
    };
    /**
     * Format data
     *
     * @method format
     * @param data {any}
     * @returns {any}
     */
    ParameterResult.prototype.format = function (data) {
        if ((typeof data === 'string') || (typeof data === 'number')
            || (data === null)) {
            return data;
        }
        if (typeof data === 'undefined') {
            return 'undefined';
        }
        return data.toString();
    };
    return ParameterResult;
})(ParameterAbstract);
exports.ParameterResult = ParameterResult;
/**
 * The {{#crossLink "ParameterJoin"}}{{/crossLink}} Dynamic parameter join
 *
 * @class ParameterJoin
 * @extends ParameterAbstract
 * @param separator {string}
 * @param ...parameters {Parameter[]}
 * @constructor
 **/
var ParameterJoin = (function (_super) {
    __extends(ParameterJoin, _super);
    function ParameterJoin(parameters) {
        _super.call(this);
        this.parameters = parameters;
    }
    /**
     * Get value for parameter
     *
     * @method getValue
     * @param results {any[]}
     * @returns {any}
     * @public
     */
    ParameterJoin.prototype.getValue = function (results) {
        var values = [];
        for (var i = 0; i < this.parameters.length; i++) {
            values.push(this.parameters[i].getValue(results));
        }
        return values;
    };
    return ParameterJoin;
})(ParameterAbstract);
exports.ParameterJoin = ParameterJoin;
/**
 * The {{#crossLink "ParameterSelectIn"}}{{/crossLink}} Dynamic parameter from select
 *
 * @class ParameterSelectIn
 * @extends ParameterAbstract
 * @param separator {string}
 * @param ...parameters {Parameter[]}
 * @constructor
 **/
var ParameterSelectIn = (function (_super) {
    __extends(ParameterSelectIn, _super);
    function ParameterSelectIn(index, key) {
        _super.call(this);
        this.index = index;
        this.key = key;
    }
    /**
     * Get value for parameter
     *
     * @method getValue
     * @param results {any[]}
     * @returns {any}
     * @public
     */
    ParameterSelectIn.prototype.getValue = function (results) {
        if (typeof results[this.index] === 'undefined') {
            throw new Error('not found result data for index: ' + this.index.toString());
        }
        if (!(results[this.index] instanceof Array)) {
            throw new Error('result data for index: ' + this.index.toString() + ' is not array list');
        }
        var values = [];
        for (var i = 0; i < results[this.index].length; i++) {
            if ((i == 0) && (typeof results[this.index][i][this.key] === 'undefined')) {
                throw new Error('result data for index: ' + this.index.toString() + ' not found data in key: ' + this.key);
            }
            values.push(results[this.index][i][this.key]);
        }
        return values;
    };
    return ParameterSelectIn;
})(ParameterAbstract);
exports.ParameterSelectIn = ParameterSelectIn;
