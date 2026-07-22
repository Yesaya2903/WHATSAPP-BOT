const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config/config.json");


module.exports = async (client, msg) => {

    const config = JSON.parse(
        fs.readFileSync(configPath, "utf8")
    );


    const currentEnv = config.environment;


    if (!config[currentEnv]) {
        return msg.reply(
            "❌ Environment tidak ditemukan."
        );
    }


    const args = msg.body
        .trim()
        .split(/\s+/);


    const mode = (args[1] || "").toLowerCase();


    if (!["on", "off"].includes(mode)) {

        return msg.reply(
            `📡 Auto Forward ${currentEnv}: ${
                config[currentEnv].enabled
                    ? "ON ✅"
                    : "OFF ❌"
            }\n\nGunakan:\n/autoforward on\n/autoforward off`
        );

    }


    config[currentEnv].enabled = mode === "on";


    fs.writeFileSync(
        configPath,
        JSON.stringify(config, null, 4),
        "utf8"
    );


    await msg.reply(
        config[currentEnv].enabled
            ? `✅ Auto Forward ${currentEnv} dinyalakan.`
            : `❌ Auto Forward ${currentEnv} dimatikan.`
    );

};