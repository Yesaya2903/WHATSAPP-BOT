const config = require("../config/config.json");
const storage = require("../services/storage");
const messageCache = require("../services/messageCache");

const currentConfig = config[config.environment];

module.exports = async (client, msg, channelId) => {

    console.log("========================================");
    console.log("FORWARD MESSAGE");
    console.log("----------------------------------------");
    console.log("MESSAGE ID    :", msg.id._serialized);
    console.log("GROUP ID      :", msg.from);
    console.log("SENDER ID     :", msg.author || msg.from);
    console.log("TARGET ID     :", currentConfig.channelId);
    console.log("TYPE          :", msg.type);
    console.log("HAS MEDIA     :", msg.hasMedia);
    console.log("BODY          :", msg.body || "(Kosong)");
    console.log("========================================");

    let channelMessage;

    if (!msg.hasMedia) {

        if (!msg.body || !msg.body.trim()) {
            return;
        }

        channelMessage = await client.sendMessage(
            currentConfig.channelId,
            msg.body
        );

    } else {

        const media = await msg.downloadMedia();

        if (!media) {
            throw new Error("Media gagal didownload.");
        }

        channelMessage = await client.sendMessage(
            currentConfig.channelId,
            media,
            {
                caption: msg.body || ""
            }
        );

    }

    // ================================
    // Simpan object Message ke cache
    // ================================
    messageCache.saveMessage(
        msg.id._serialized,
        channelMessage
    );

    // ================================
    // Simpan mapping ke database
    // ================================
    storage.saveMessage({
        groupMessageId: msg.id._serialized,
        channelMessageId: channelMessage.id._serialized,
        groupId: msg.from,
        channelId: currentConfig.channelId,
        createdAt: new Date().toISOString()
    });

    console.log("Message berhasil disimpan ke cache.");
    console.log("Mapping berhasil disimpan ke database.");

};