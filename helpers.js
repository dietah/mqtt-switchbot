const moment = require('moment');

module.exports = {
	getCurrentTimestamp,
	getProjectRoot
};

function getCurrentTimestamp() {
	return moment().format('YYYY-MM-DD-HH-mm-ss');
}

function getProjectRoot() {
	const directory = __dirname.split('/');

	return directory.join('/');
}
