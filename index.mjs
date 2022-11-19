import Switchbot from 'node-switchbot';
import mqtt from 'mqtt';

import logger from './logger.js';
import config from './env.js';

const consoleConfig = { ...config, MQTT_USERNAME: '[REDACTED]', MQTT_PASSWORD: '[REDACTED]' };
logger.info('environment variables:\n', consoleConfig);

const switchbot = new Switchbot();
const mqttClient = mqtt.connect({ port: config.MQTT_PORT, host: config.MQTT_HOST, username: config.MQTT_USERNAME, password: config.MQTT_PASSWORD });

let devices = config.DEVICE_LIST ? config.DEVICE_LIST.split(',').map(device => device.trim().split('|')[0]) : [];
let deviceNames = {};

(async () => {
	// Use auto scan when no device list was provided
	if (!config.DEVICE_LIST) {
		logger.info('started scanning');
		const bots = await switchbot.discover({ model: 'H', duration: config.SCAN_DURATION });
		logger.info(`found ${bots.length} bot(s)`);

		bots.forEach((bot) => {
			if (bot.address.length > 0) devices.push(bot.address);
		});

		// In some cases on macOS not all address were detected, had way better results on buster-slim
		if (bots.length !== devices.length) logger.warn(`found ${bots.length} bot(s) but only received ${devices.length} address(es)`);
		if (devices.length === 0) {
			logger.info('could not find any bots, shutting down');
			process.exit(0);
		}

		deviceNames = devices.reduce((a, v) => ({ ...a, [v]: v }), {});
	} else {
		logger.info('DEVICE_LIST found, skipping startup scan');
		deviceNames = config.DEVICE_LIST.split(',').reduce((a, v) => ({ ...a, [v.trim().split('|')[0]]: v.trim().split('|')[1] || v.trim().split('|')[0] }), {});
	}

	const deviceTopics = devices.map(device => `${config.MQTT_TOPIC}/switch/${deviceNames[device]}/set`);
	mqttClient.subscribe(deviceTopics, (error, grants) => {
		grants.forEach(grant => logger.debug(`mqtt client subscribed to '${grant.topic}'`));
	});

	mqttClient.on('message', (topic, message) => {
		logger.debug(`mqtt message received on ${topic} ${message.toString()}`);

		if (topic.endsWith('set') && message.length !== 0) {
			const deviceTopic = topic.split('/')[2];
			const parsedMessage = message.toString().toLowerCase();
			const address = Object.keys(deviceNames).find(key => deviceNames[key] === deviceTopic);
			workBot(address, parsedMessage);
			reportBotStatus(address);
		}
	});

	mqttClient.on('connect', () => logger.debug('mqtt connected'));
	mqttClient.on('end', () => logger.debug('mqtt ended'));
	mqttClient.on('error', (e) => logger.error('mqtt error %o', e));
})();

async function workBot(address, action) {
	let [bot] = await switchbot.discover({ id: address, quick: true });

	// In some cases the quick scan came up empty, so using a full scan with filter instead
	if (!bot) {
		logger.debug('quick scan came up empty, reverting to full scan');
		const bots = await switchbot.discover({ model: 'H', duration: config.SCAN_DURATION });
		bot = bots.find(b => b.address === address);
	}

	if (bot) {
		logger.info(`executing ${action} for ${deviceNames[address] !== address ? address + ' - ' + deviceNames[address] : address}`);

		// In some cases the switchbot lib returned
		// "Error: Failed to discover services and characteristics: DISCONNECTED" and crashed
		// In this case we keep retrying until successful
		let keepTrying;
		let attempts = 1;
		do {
			try {
				switch (action) {
					case 'press':
						await bot.press();
						break;
					case 'on':
						await bot.turnOn();
						break;
					case 'off':
						await bot.turnOff();
						break;
					case 'down':
						await bot.down();
						break;
					case 'up':
						await bot.up();
						break;
					default:
						logger.warn(`action ${action} was not defined`);
						break;
				}
				keepTrying = false;
				logger.debug(`successful after ${attempts} attempts`);
			} catch {
				keepTrying = true;
				attempts++;
				logger.warn('switchbot-lib internal error, retrying');

				if (attempts > config.RETRY_LIMIT) {
					keepTrying = false;
					logger.warn(`switchbot ${deviceNames[address] !== address ? address + ' - ' + deviceNames[address] : address} probably has a low battery and could not be reached`);
				}
			}
		} while (keepTrying);
	} else {
		logger.warn(`could not find bot with address ${address}`);
	}
}

async function reportBotStatus(address) {
	await switchbot.startScan({ id: address });

	switchbot.onadvertisement = (ad) => {
		mqttClient.publish(`${config.MQTT_TOPIC}/switch/${deviceNames[address]}/battery`, `${ad.serviceData.battery}`);
		mqttClient.publish(`${config.MQTT_TOPIC}/switch/${deviceNames[address]}/linkquality`, `${ad.rssi}`);
	};

	await switchbot.wait(10 * 1000);
	switchbot.stopScan();
}
