const envalid = require('envalid'); // eslint-disable-line object-curly-newline

/* eslint-disable key-spacing */
module.exports = envalid.cleanEnv(process.env, {
	LOG_LEVEL: 		envalid.str({ choices: ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'], default: 'INFO', devDefault: 'DEBUG' }),

	SCAN_DURATION:	envalid.num({ default: 5000, desc: 'Duration for discovery process (ms)' }),
	DEVICE_LIST:	envalid.str({ default: undefined, desc: 'Comma separated list of MAC addresses' }),

	MQTT_HOST:		envalid.host({ desc: 'The MQTT broker host address' }),
	MQTT_PORT:		envalid.port({ default: 1883, desc: 'The MQTT broker port' }),
	MQTT_USERNAME:	envalid.str({ default: undefined, desc: 'The MQTT username' }),
	MQTT_PASSWORD:	envalid.str({ default: undefined, desc: 'The MQTT username' }),
	MQTT_TOPIC:		envalid.str({ default:'switchbot', desc: 'The MQTT topic to publish the data' }),
}, {
	strict: true
});
