//Домофоная панель от Интерсвязь
const syslog = new (require("syslog-server"))();
const { hw: { is } } = require("./config.json");
const { getTimestamp } = require("./utils/formatDate");
const { urlParser } = require("./utils/url_parser");
const API = require("./utils/api");
const { port } = urlParser(is);

let gate_rabbits = {};

syslog.on("message", async ({ date, host, protocol, message }) => {
    const now = parseInt(getTimestamp(date));
    const is_msg = message.split(" - - ")[1].trim();

    // Фильтр сообщений, не несущих смысловой нагрузки
    if (
        is_msg.indexOf("STM32.DEBUG") >= 0 ||
        is_msg.indexOf("Вызов метода") >= 0 ||
        is_msg.indexOf("Тело запроса") >= 0 ||
        is_msg.indexOf("libre") >= 0 ||
        is_msg.indexOf("ddns") >= 0
    ) {
        return;
    }

    console.log(`${now} || ${host} || ${is_msg}`);

    // Отправка сообщения в syslog storage
    await API.sendLog({ date: now, ip: host, unit: "beward", msg: is_msg });

    // Открытие двери RFID ключом
    if (/^Opening door by RFID [a-fA-F0-9]+, apartment \d+$/.test(is_msg)) {
        const rfid = is_msg.split("RFID")[1].split(",")[0].trim();
        await API.openDoor({ date: now, ip: host, detail: rfid, by: "rfid" });
    }

    // Открытие двери персональным кодом
    if (is_msg.indexOf("Opening door by code") >= 0) {
        const code = parseInt(is_msg.split("code")[1].split(",")[0]);
        if (code) {
            await API.openDoor({ date: now, ip: host, detail: code, by: "code" });
        }
    }

    // Открытие двери DTMF кодом
    if (is_msg.indexOf("Open main door by DTMF") >= 0){
        await API.openDoor({ date: now, ip: host, detail: null, by: "dtmf" });
    }

    // Детектор движения: старт
    if (is_msg.indexOf("EVENT: Detected motion") >= 0) {
        await API.motionDetection({ date: now, ip: host, motionStart: true });
    }
});

syslog.on("error", (err) => {
    console.error(err.message);
});

syslog.start({port}).then(() => console.log(`Start INTERSVIAZ syslog service on port ${port}`));
