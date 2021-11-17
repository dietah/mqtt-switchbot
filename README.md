## mqtt-switchbot
Small Node.js application or docker container that triggers a [SwitchBot Bot](https://www.switch-bot.com/products/switchbot-bot) action based on a MQTT message.

The script will automatically scan for all Bot devices and creates a MQTT topic for each device. You can ignore the initial scan by providing the `DEVICE_LIST` environment variable with a comma delimited list of Bot MAC addresses.

The topic per device that the script will listen to is `{MQTT_TOPIC}/switch/{DEVICE_MAC}/set`. You can send `press`, `on`, `off`, `down` or `up` depending on how you configured your bot.

The bot will also publish its linkquality and battery status after each action on:
```
{MQTT_TOPIC}/switch/{DEVICE_MAC}/battery
{MQTT_TOPIC}/switch/{DEVICE_MAC}/linkquality
```
This makes it easier to read out the values in any home automation application.
Note that the script will keep retrying until it gets a response that the action is performed.

---

## Prerequisites
Make sure your host OS has the necessary Bluetooth libraries installed. If not run the following for Ubuntu, Debian or Raspberry Pi OS.
```
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```
If you use any other OS, follow the instructions described in the document of the [@abandonware/noble](https://github.com/abandonware/noble).

## The code
### Run locally
You can run the code by:
1. Make sure you have nodejs installed on your system
2. Run `npm install` (only needed the first time)
3. Run `npm start` or `node .`

### Docker
You should be able to build the Docker container locally but be aware of the cpu architecture you are building it on. The current main Dockerfile is set for amd64 CPU architecture.
```
docker build . -t deetoreu/mqtt-switchbot:latest
```

The latest BlueZ stack is not build for arm64 so I previously invested some time to get it working there but decided to switch to amd64 instead.
If you want to try to build for arm64 you can use:
```
docker build . -f Dockerfile-arm -t deetoreu/mqtt-switchbot:latest
```
(this file will not be maintianed further)

## Deployment
The docker container is available on Docker Hub: https://hub.docker.com/r/deetoreu/mqtt-switchbot

### Environment variables
These variables can be passed to the image from kubernetes.yaml or docker-compose.yml as needed:

Variable | Type | Default | Required | Description |
-------- | ---- | ------- | -------- | ----------- |
LOG_LEVEL | String | DEBUG | x | log4js debug level, choices are: OFF, FATAL, ERROR, WARN, INFO, DEBUG, TRACE, ALL, but I reccomend keeping it on DEBUG
SCAN_DURATION | Number | 5 * 1000 | x | Duration for discovery process (ms)
DEVICE_LIST | String |  |  | Comma delimited string of Bot MAC addresses
RETRY_LIMIT | Number | 5 |  | Command retry limit before a warning is logged
MQTT_HOST | String |  | x | The host address of the MQTT broker
MQTT_PORT | Number | 1883 | x | The MQTT broker port
MQTT_USERNAME | String |  |  | MQTT username in case it is secured
MQTT_PASSWORD | String |  |  | MQTT password in case it is secured
MQTT_TOPIC | String | 'switchbot' | x | The MQTT topic where the data is published

### Log files
Everything is logged on the console but also saved to a file per startup.
If you want your logs to be persistent you can map a volume to `/usr/src/app/logs`

### Docker
If you want to access your internal bluetooth device the container needs access to the host network as you cannot transfer bluetooth separately, hence `--net=host`

Docker run example, depending on your setup:
```
sudo docker run --rm --privileged -e MQTT_HOST="192.168.1.123" -e LOG_LEVEL="DEBUG" --net=host deetoreu/mqtt-switchbot:latest
```
or add the detach `-d` flag to run in the background

docker-compose.yml example:
```yaml
version: '3.6'
services:
  mqtt-switchbot:
    container_name: switchbot
    image: deetoreu/mqtt-switchbot
    restart: unless-stopped
    environment:
      MQTT_HOST: "192.168.1.123"
    volumes:
      - ./volumes/switchbot/logs:/usr/src/app/logs
```
apply with `docker-compose -f docker-compose.yml up -d`

---

## Backstory
I wanted to automate my coffee machine that is still under waranty and I already knew SwitchBot as a possible solution. After some research I found out that they use an open BLE protocol so it would be possible to address the bots without buying the extra Hub to connect them to the cloud.

I plan on integrating them into my OpenHAB setup which already has MQTT set up and it's always a good idea to abstract custom code. And since I like docker I could isolate the functionality. I will be running this on a NUC in a virtualized environment.
## Notes
* Developing this on MacOS gives mixed results with sometimes the devices not being found. Therefore I added some resilience in the code to retry.
* I am running Raspberry Pi OS 64bit beta on a RPi 4B and even after installing the necessary libs it did not work well at all. The downsides of a beta I guess.
* If you are running a virtualisation like Proxmox you cannot transfer the internal bluetooth device and you need a USB dongle.

## Add to the project
Feel free to add your comments, report issues or make a PR to the project.

I hope this was of some help to at least someone.
