declare module "mysql-sequence-ts"
{
    export = MysqlSequenceTs;
}

declare module MysqlSequenceTs
{
	export class MysqlSequence
	{
		constructor(connection, transaction?:boolean);
		public addQuery(sql:string, values?:any[]);
		public exec(callback?:(results:any[])=>void, errorCallback?:(err:any, idx:number)=>void);
	}
	
	class ParameterAbstract
	{
		
	}

	export class ParameterResult extends ParameterAbstract
	{
		constructor(index:number, key1:any, key2?:any);
	}
	
	export class ParameterJoin extends ParameterAbstract
	{
		constructor(parameters:ParameterAbstract[]);
	}
	
	export class ParameterSelectIn extends ParameterAbstract
	{
		constructor(index:number, key:string);
	}
}