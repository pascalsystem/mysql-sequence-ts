/// <reference path='./../typings/node/node.d.ts' />
/// <reference path='./../node_modules/callback-manager-ts/callback-manager-ts.d.ts' />
var callbackManager = require('callback-manager-ts');
var parameters = require('./parameters');
exports.ParameterResult = parameters.ParameterResult;
exports.ParameterJoin = parameters.ParameterJoin;
exports.ParameterSelectIn = parameters.ParameterSelectIn;
/**
 * The {{#crossLink "MysqlSequence"}}{{/crossLink}} Mysql sequence mutli query
 *
 * @class MysqlSequence
 * @param connection {Object}
 * @param transaction {boolean}
 * @constructor
 **/
var MysqlSequence = (function () {
    function MysqlSequence(connection, transaction) {
        /**
         * Transaction
         *
         * @property transaction
         * @type {boolean}
         * @private
         */
        this.transaction = false;
        /**
         * Query list
         *
         * @property queries
         * @type {{sql:string, values:any[]}[]}
         * @private
         */
        this.queries = [];
        /**
         * Query results
         *
         * @property results
         * @type {any[]}
         * @private
         */
        this.results = [];
        /**
         * Last error
         *
         * @property lastError
         * @type {Error}
         * @private
         */
        this.lastError = null;
        /**
         * Last error query index
         *
         * @property indexError
         * @type {number}
         * @private
         */
        this.indexError = null;
        this.connection = connection;
        this.callbackManager = new callbackManager.AsyncBreak();
        if (typeof transaction === 'boolean') {
            this.transaction = transaction;
        }
    }
    /**
     * Add query
     *
     * @method addQuery
     * @param sql {string}
     * @param values {any[]}
     * @public
     */
    MysqlSequence.prototype.addQuery = function (sql, values) {
        this.callbackManager.addObjectMethod(this, 'execNextQuery', [this.queries.length], undefined, 0);
        this.queries.push({
            sql: sql,
            values: (typeof values === 'object') ? values : []
        });
        this.results.push(undefined);
    };
    /**
     * Execute queries
     *
     * @method exec
     * @param callback {Function}
     * @param errorCallback {Function}
     * @public
     */
    MysqlSequence.prototype.exec = function (callback, errorCallback) {
        this.callbackSuccess = (typeof callback === 'function') ? callback : function (results) { };
        this.callbackError = (typeof errorCallback === 'function') ? errorCallback : function (err, idx) { };
        if (this.transaction) {
            var self = this;
            this.connection.beginTransaction(function (err) {
                if (err) {
                    self.lastError = err;
                    self.indexError = MysqlSequence.INDEX_TRANSACTION_ERROR;
                    return;
                }
                self.init();
            });
            return;
        }
        this.init();
    };
    /**
     * Init execute queries
     *
     * @method init
     * @private
     */
    MysqlSequence.prototype.init = function () {
        var self = this;
        this.callbackManager.start(function (results) {
            self.sendResponse();
        }, function (results) {
            self.sendResponse();
        });
    };
    /**
     * Execute next query from queue
     *
     * @method execNextQuery
     * @param idx {number}
     * @param callback {Function}
     * @private
     */
    MysqlSequence.prototype.execNextQuery = function (idx, callback) {
        var self = this;
        var values = [];
        try {
            for (var i = 0; i < this.queries[idx].values.length; i++) {
                if (this.queries[idx].values[i] instanceof parameters.ParameterAbstract) {
                    values[i] = this.getParameterValue(this.queries[idx].values[i]);
                }
                else {
                    values[i] = this.queries[idx].values[i];
                }
            }
        }
        catch (err) {
            self.lastError = err;
            self.indexError = idx;
            return callback(err, null);
        }
        this.connection.query(this.queries[idx].sql, values, function (err, results) {
            if (err) {
                self.lastError = err;
                self.indexError = idx;
                return callback(err, null);
            }
            self.results[idx] = results;
            callback(null, null);
        });
    };
    /**
     * Get parameter dynamic value
     *
     * @method getParameterValue
     * @param parameter {Parameter}
     * @returns {any}
     * @private
     */
    MysqlSequence.prototype.getParameterValue = function (parameter) {
        return parameter.getValue(this.results);
    };
    /**
     * Send response to callback
     *
     * @method sendResponse
     * @private
     */
    MysqlSequence.prototype.sendResponse = function () {
        if (this.transaction) {
            var self = this;
            if (this.lastError === null) {
                this.connection.commit(function (err) {
                    self.lastError = err;
                    self.indexError = MysqlSequence.INDEX_TRANSACTION_ERROR;
                    self.executeCallback();
                });
            }
            else if (this.indexError === MysqlSequence.INDEX_TRANSACTION_ERROR) {
                self.executeCallback();
            }
            else {
                this.connection.rollback(function () {
                    self.executeCallback();
                });
            }
        }
        else {
            this.executeCallback();
        }
    };
    /**
     * Execute callback
     *
     * @method executeCallback
     * @private
     */
    MysqlSequence.prototype.executeCallback = function () {
        if (this.lastError === null) {
            this.callbackSuccess(this.results);
        }
        else {
            this.callbackError(this.lastError, this.indexError);
        }
    };
    /**
     * Error for begin transaction
     *
     * @property INDEX_TRANSACTION_ERROR
     * @type {number}
     * @default -1
     * @private
     */
    MysqlSequence.INDEX_TRANSACTION_ERROR = -1;
    return MysqlSequence;
})();
exports.MysqlSequence = MysqlSequence;
