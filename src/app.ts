/// <reference path='./../typings/node/node.d.ts' />
/// <reference path='./../node_modules/callback-manager-ts/callback-manager-ts.d.ts' />

import callbackManager = require('callback-manager-ts');
import parameters = require('./parameters');

exports.ParameterResult = parameters.ParameterResult;
exports.ParameterJoin = parameters.ParameterJoin;
exports.ParameterSelectIn = parameters.ParameterSelectIn;

/**
 * The {{#crossLink "Query"}}{{/crossLink}} Query
 *
 * @interface Query
 **/
interface Query
{
	/**
	 * Sql query
	 * 
	 * @property sql
	 * @type {string}
	 * @public
	 */
	sql:string;
	/**
	 * Values
	 * 
	 * @property values
	 * @type {any[]}
	 * @public
	 */
	values:any[];	
}

/**
 * The {{#crossLink "MysqlSequence"}}{{/crossLink}} Mysql sequence mutli query
 *
 * @class MysqlSequence
 * @param connection {Object}
 * @param transaction {boolean}
 * @constructor
 **/
export class MysqlSequence
{
	/**
	 * Error for begin transaction
	 * 
	 * @property INDEX_TRANSACTION_ERROR
	 * @type {number}
	 * @default -1
	 * @private
	 */
	private static INDEX_TRANSACTION_ERROR:number = -1;
	
	/**
	 * Transaction
	 * 
	 * @property transaction
	 * @type {boolean}
	 * @private
	 */
	private transaction:boolean = false;
	/**
	 * Callback manager
	 * 
	 * @property callbackManager
	 * @type {AsyncBreak}
	 * @private
	 */
	private callbackManager:callbackManager.AsyncBreak;
	/**
	 * Mysql connection
	 * 
	 * @property connection
	 * @type {any}
	 * @private
	 */
	private connection;
	/**
	 * Query list
	 * 
	 * @property queries
	 * @type {Query[]}
	 * @private
	 */
	private queries:Query[] = [];
	/**
	 * Query results
	 * 
	 * @property results
	 * @type {any[]}
	 * @private
	 */
	private results:any[] = [];
	/**
	 * Last error
	 * 
	 * @property lastError
	 * @type {Error}
	 * @private
	 */
	private lastError:Error = null;
	/**
	 * Last error query index
	 * 
	 * @property indexError
	 * @type {number}
	 * @private
	 */
	private indexError:number = null;
	/**
	 * Callback on success
	 * 
	 * @property callbackSuccess
	 * @type {Function}
	 * @private
	 */
	private callbackSuccess:(results:any[])=>void;
	/**
	 * Callback on error
	 * 
	 * @property callbackSuccess
	 * @type {Function}
	 * @private
	 */
	private callbackError:(err:any, idx:number)=>void;
	
	constructor(connection, transaction?:boolean)
	{
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
	public addQuery(sql:string, values?:any[])
	{
		this.callbackManager.addObjectMethod(this, 'execNextQuery', [this.queries.length], undefined, 0);
		this.queries.push({
			sql: sql,
			values:(typeof values === 'object') ? values : []
		});
		this.results.push(undefined);
	}
	
	
	/**
	 * Execute queries
	 * 
	 * @method exec
	 * @param callback {Function}
	 * @param errorCallback {Function}
	 * @public
	 */
	public exec(callback?:(results:any[])=>void, errorCallback?:(err:any, idx:number)=>void)
	{
		this.callbackSuccess = (typeof callback === 'function') ? callback : (results:any[])=>{};
		this.callbackError = (typeof errorCallback === 'function') ? errorCallback : (err:any, idx:number)=>{};
		
		if (this.transaction) {
			var self:MysqlSequence = this;
			this.connection.beginTransaction((err)=>{
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
	}
	
	/**
	 * Init execute queries
	 * 
	 * @method init
	 * @private
	 */
	private init()
	{
		var self:MysqlSequence = this;
		this.callbackManager.start((results: callbackManager.BasicResult)=>{
			self.sendResponse();
		}, (results:callbackManager.BasicResult)=>{
			self.sendResponse();
		});
	}
	
	/**
	 * Execute next query from queue
	 * 
	 * @method execNextQuery
	 * @param idx {number}
	 * @param callback {Function}
	 * @private
	 */
	private execNextQuery(idx, callback:Function)
	{
		var self:MysqlSequence = this;
		var values:any[] = [];
		try {
			for (var i=0;i<this.queries[idx].values.length;i++) {
				if (this.queries[idx].values[i] instanceof parameters.ParameterAbstract) {
					values[i] = this.getParameterValue(this.queries[idx].values[i]);
				} else {
					values[i] = this.queries[idx].values[i];
				}
			}
		} catch (err) {
			self.lastError = err;
			self.indexError = idx;
			return callback(err, null);
		}
		this.connection.query(this.queries[idx].sql, values, (err, results)=>{
			if (err) {
				self.lastError = err;
				self.indexError = idx;
				return callback(err, null);
			}
			self.results[idx] = results
			callback(null, null);
		});
	}
	
	/**
	 * Get parameter dynamic value
	 * 
	 * @method getParameterValue
	 * @param parameter {Parameter}
	 * @returns {any}
	 * @private
	 */
	private getParameterValue(parameter:parameters.ParameterAbstract):any
	{
		return parameter.getValue(this.results);
	}
	
	/**
	 * Send response to callback
	 * 
	 * @method sendResponse
	 * @private
	 */
	private sendResponse()
	{
		if (this.transaction) {
			var self:MysqlSequence = this;
			if (this.lastError === null) {
				this.connection.commit((err)=>{
					self.lastError = err;
					self.indexError = MysqlSequence.INDEX_TRANSACTION_ERROR;
					self.executeCallback();
				});
			} else if (this.indexError === MysqlSequence.INDEX_TRANSACTION_ERROR) {
				self.executeCallback();
			} else {
				this.connection.rollback(()=>{
					self.executeCallback();
				});
			}
		} else {
			this.executeCallback();
		}
	}
	
	/**
	 * Execute callback
	 * 
	 * @method executeCallback
	 * @private
	 */
	private executeCallback()
	{
		if (this.lastError === null) {
			this.callbackSuccess(this.results);
		} else {
			this.callbackError(this.lastError, this.indexError);
		}
	}
}