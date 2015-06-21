var lib = require('./../dist/app');
var mysql = require('mysql');

var dbConfig = {
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'reco_data'
};
var connection = mysql.createConnection(dbConfig);
var connCounter = null;
var onConnect = function(cb) {
	if (connCounter === null) {
		connCounter = 0;
		connCounter++;
		connection.connect(function(err){
		  	if (err) {
				throw new Error('can`t connect with database');
			}
			cb(connection);
		});
		return;
	}
	connCounter++;
	cb(connection);
};
var onDisconnect = function() {
	connCounter--;
};
var endConnection = function() {
	setTimeout(function(){
		if ((connCounter === 0) && connection) {
			connection.end();
		} else {
			endConnection();
		}
	}, 250);
};
endConnection();

// query queue
describe('Simple queue with query insert and select', function(){
	it("Insert 3 row and select them, after select rows by results", function(done){
		onConnect(function(connection){
			var seq = new lib.MysqlSequence(connection, true);
			seq.addQuery('INSERT INTO ?? (??) VALUES (?)', ['test_table', 'label', '1Lorem ipsum']);
			seq.addQuery('INSERT INTO ?? (??) VALUES (?)', ['test_table', 'label', '2Lorem ipsum']);
			seq.addQuery('INSERT INTO ?? (??) VALUES (?)', ['test_table', 'label', new lib.ParameterResult(1, 'insertId')]);
			seq.addQuery('SELECT * FROM ?? WHERE id IN (?)', ['test_table', new lib.ParameterJoin([
				new lib.ParameterResult(0, 'insertId'),
				new lib.ParameterResult(1, 'insertId'),
				new lib.ParameterResult(2, 'insertId')
			])]);
			seq.addQuery('SELECT * FROM ?? WHERE id in (?)', ['test_table', new lib.ParameterSelectIn(3, 'id')]);
			seq.exec(function(results){
				if (results.length !== 5) {
					throw new Error('required 5 results');
				}
				
				var q = [];
				for (var i=0;i<3;i++) {
					if (typeof results[i]['insertId'] === 'number') {
						q.push(results[i]['insertId']);
					} else {
						throw new Error('query ' + i.toString() + ' not return new insertId');
					}
				}
				
				for (var i=0;i<q.length;i++) {
					for (var k=3;k<=4;k++) {
						if (typeof results[k][i]['id'] !== 'number') {
							throw new Error('expect in ' + k.toString() + ' index query is number');
						}
						if (typeof results[k][i]['label'] !== 'string') {
							throw new Error('expect in ' + k.toString() + ' index query is string');
						}
					}
					if ((results[3][i]['label'] !== results[4][i]['label'])
						|| (results[3][i]['id'] !== results[4][i]['id'])) {
						throw new Error('diffrent data from 3 and 4 query');
					}
				}
				
				onDisconnect();
				done();
			}, function(err, idx){
				onDisconnect();
				throw new Error('error mysql results');
			});
		});
	});
	
	it("Insert 3 row in second error", function(done){
		onConnect(function(connection){
			var seq = new lib.MysqlSequence(connection, true);
			seq.addQuery('INSERT INTO ?? (??) VALUES (?)', ['test_table', 'label', '1Lorem ipsum']);
			seq.addQuery('INSERT INTO ?? (??) VALUES (?)', ['test_table', 'not_exits_column', '1Lorem ipsum']);
			seq.addQuery('INSERT INTO ?? (??) VALUES (?)', ['test_table', 'label', '1Lorem ipsum']);
			seq.exec(function(results){
				throw new Error('expect error');
				onDisconnect();
			}, function(err, idx){
				if ((idx === 1) && err && (typeof err.code === 'string') && (err.code === 'ER_BAD_FIELD_ERROR')) {
					onDisconnect();
					done();
					return;
				}
				onDisconnect();
				throw new Error('another error expect');
			});
		});
	});
});
