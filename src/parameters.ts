/// <reference path='./../typings/node/node.d.ts' />

/**
 * The {{#crossLink "ParameterAbstract"}}{{/crossLink}} Dynamic parameter abstract
 *
 * @class ParameterAbstract
 * @constructor
 **/
export class ParameterAbstract
{
	/**
	 * Get value for parameter
	 * 
	 * @method getValue
	 * @param results {any[]}
	 * @returns {any}
	 * @public
	 */
	public getValue(results:any[]):any
	{
		throw new Error('This method is abstract');
	}	
}

/**
 * The {{#crossLink "ParameterResult"}}{{/crossLink}} Dynamic parameter from result data
 *
 * @class ParameterResult
 * @extends ParameterAbstract
 * @param index {number}
 * @param ...keys {any[]}
 * @constructor
 **/
export class ParameterResult extends ParameterAbstract
{
	/**
	 * Index
	 * 
	 * @property intex
	 * @type {number}
	 * @private
	 */
	private index:number;
	/**
	 * Keys
	 * 
	 * @property key1
	 * @type {any[]}
	 * @private
	 */
	 protected key1:any;
	/**
	 * Keys
	 * 
	 * @property key1
	 * @type {any[]}
	 * @private
	 */
	 protected key2:any;
	
	constructor(index:number, key1:any, key2?:any)
	{
		super();
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
	public getValue(results:any[]):any
	{
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
	}
	
	/**
	 * Format data
	 * 
	 * @method format
	 * @param data {any}
	 * @returns {any}
	 */
	private format(data:any):any
	{
		if ((typeof data === 'string') || (typeof data === 'number')
			|| (data === null)) {
			return data;
		}
		if (typeof data === 'undefined') {
			return 'undefined';
		}
		
		return data.toString();
	}
}

/**
 * The {{#crossLink "ParameterJoin"}}{{/crossLink}} Dynamic parameter join
 *
 * @class ParameterJoin
 * @extends ParameterAbstract
 * @param separator {string}
 * @param ...parameters {Parameter[]}
 * @constructor
 **/
export class ParameterJoin extends ParameterAbstract
{
	/**
	 * Parameters
	 * 
	 * @property parameters
	 * @type {ParameterAbstract[]}
	 * @private
	 */
	protected parameters:ParameterAbstract[]
	
	constructor(parameters:ParameterAbstract[])
	{
		super();
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
	public getValue(results:any[]):any
	{
		var values:any[] = [];
		for (var i=0;i<this.parameters.length;i++) {
			values.push(this.parameters[i].getValue(results));
		}
		
		return values;
	}
}

/**
 * The {{#crossLink "ParameterSelectIn"}}{{/crossLink}} Dynamic parameter from select
 *
 * @class ParameterSelectIn
 * @extends ParameterAbstract
 * @param separator {string}
 * @param ...parameters {Parameter[]}
 * @constructor
 **/
export class ParameterSelectIn extends ParameterAbstract
{
	/**
	 * Index
	 * 
	 * @property intex
	 * @type {number}
	 * @private
	 */
	private index:number;
	/**
	 * Key
	 * 
	 * @property key
	 * @type {string}
	 * @private
	 */
	private key:string;
	
	constructor(index:number, key:string)
	{
		super();
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
	public getValue(results:any[]):any
	{
		if (typeof results[this.index] === 'undefined') {
			throw new Error('not found result data for index: ' + this.index.toString());
		}
		if (!(results[this.index] instanceof Array)) {
			throw new Error('result data for index: ' + this.index.toString() + ' is not array list');
		}
		var values:any[] = [];
		for (var i=0;i<results[this.index].length;i++) {
			if ((i==0) && (typeof results[this.index][i][this.key] === 'undefined')) {
				throw new Error('result data for index: ' + this.index.toString() + ' not found data in key: ' + this.key);
			}
			values.push(results[this.index][i][this.key]);
		}
		
		return values;
	}
}