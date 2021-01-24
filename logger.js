// Get external dependencies
const log4js = require('log4js');
const { getProjectRoot, getCurrentTimestamp } = require('./helpers');

log4js.configure({
	appenders: {
		console: { type: 'console' },
		file: {
			type: 'file',
			filename: `${getProjectRoot()}/logs/${getCurrentTimestamp()}.log`
		}
	},
	categories: {
		default: { appenders: ['console', 'file'], level: 'debug' }
	}
});

const logger = log4js.getLogger('mqtt-switchbot');

// Log4js Log Levels
// OFF
// FATAL
// ERROR
// WARN
// INFO
// DEBUG
// TRACE
// ALL
// The levels are cumulative.
// If you for example set the logging level to WARN all warnings, errors and fatals are logged

module.exports = {
	trace,
	info,
	debug,
	warn,
	error,
	line
};

function trace(...args) {
	run(logger.trace, parseArgs(args));
}

function info(...args) {
	run(logger.info, parseArgs(args));
}

function debug(...args) {
	run(logger.debug, parseArgs(args));
}

function warn(...args) {
	run(logger.warn, parseArgs(args));
}

function error(...args) {
	run(logger.error, parseArgs(args));
}

function parseArgs(args) {
	let sentence = args.shift();
	if (typeof sentence === 'object') sentence = JSON.stringify(sentence);
	return [sentence].concat(args);
}

function line() {
	logger.debug('-------------------------------------------------------------------------------');
}

function run(f, args) {
	f.apply(logger, args);
}
