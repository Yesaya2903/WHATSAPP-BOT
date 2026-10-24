const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

const commandHandler = require("./commands/handler");
const forwardCommand = require("./commands/forward");

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "forward-bot"
    })
});

// Timestamp dalam detik, sesuai timestamp pesan WhatsApp.
let botReadyAt = null;

function getConfig() {
    const configPath = path.join(
        __dirname,
        "config",
        "config.json"
    );

    return JSON.parse(
        fs.readFileSync(configPath, "utf8")
    );
}

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    botReadyAt = Math.floor(Date.now() / 1000);

    console.log("----------------------");
    console.log("Bot sudah siap dipakai");
    console.log("Pesan sebelum waktu ini akan diabaikan.");
    console.log("----------------------");
});

client.on("disconnected", (reason) => {
    botReadyAt = null;

    console.log("Bot terputus:", reason);
});

client.on("message", async (msg) => {
    try {
        // Abaikan pesan lama yang baru tersinkron,
        // serta pesan yang diterima sebelum bot siap.
        if (
            botReadyAt === null ||
            !Number.isFinite(msg.timestamp) ||
            msg.timestamp <= botReadyAt
        ) {
            return;
        }

        console.log("----------------------");
        console.log("New message");
        console.log("From         :", msg.from);
        console.log("From me      :", msg.fromMe);
        console.log("Body Message :", msg.body);
        console.log("----------------------");

        // ============================
        // COMMAND
        // ============================
        await commandHandler(client, msg);

        // ============================
        // AUTO FORWARD
        // ============================
        const config = getConfig();
        const currentConfig = config[config.environment];

        if (
            currentConfig &&
            currentConfig.enabled === true &&
            msg.from === currentConfig.sourceGroupId &&
            !msg.fromMe &&
            !(msg.body || "").startsWith("/")
        ) {
            console.log(
                "AUTO FORWARD AKTIF:",
                config.environment
            );

            await forwardCommand(
                client,
                msg,
                currentConfig.channelId
            );
        }
    } catch (error) {
        console.error(
            "Gagal memproses pesan:",
            error?.stack || error
        );
    }
});

client.initialize().catch((error) => {
    console.error(
        "Gagal menjalankan bot:",
        error?.stack || error
    );
});