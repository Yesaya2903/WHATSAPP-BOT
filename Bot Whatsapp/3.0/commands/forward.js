const config = require("../config/config.json");
const storage = require("../services/storage");
const messageCache = require("../services/messageCache");

const currentConfig = config[config.environment];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadMediaWithRetry(msg, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(
                `Mencoba download media... (${attempt}/${maxRetries})`
            );

            // Workaround untuk perubahan object ID WhatsApp Web
            if (
                msg.id &&
                !msg.id._serialized &&
                msg.id.$1
            ) {
                msg.id._serialized = msg.id.$1;
            }

            const media = await msg.downloadMedia();

            if (media) {
                console.log("Media berhasil didownload.");
                return media;
            }

            console.log("downloadMedia() mengembalikan media kosong.");

        } catch (error) {
            console.error(
                `Download media percobaan ${attempt} gagal:`,
                error?.message || error
            );
        }

        if (attempt < maxRetries) {
            console.log("Menunggu 2 detik sebelum mencoba lagi...");
            await sleep(2000);
        }
    }

    return null;
}

module.exports = async (client, msg, channelId) => {

    console.log("========================================");
    console.log("FORWARD MESSAGE");
    console.log("----------------------------------------");
    console.log("MESSAGE ID    :", msg.id?._serialized || msg.id?.$1 || "(unknown)");
    console.log("GROUP ID      :", msg.from);
    console.log("SENDER ID     :", msg.author || msg.from);
    console.log("TARGET ID     :", currentConfig.channelId);
    console.log("TYPE          :", msg.type);
    console.log("HAS MEDIA     :", msg.hasMedia);
    console.log("BODY          :", msg.body || "(Kosong)");
    console.log("========================================");

    let channelMessage = null;

    try {

        // ========================================
        // PESAN TANPA MEDIA
        // ========================================
        if (!msg.hasMedia) {

            if (!msg.body || !msg.body.trim()) {
                console.log("Pesan kosong. Tidak diforward.");
                return;
            }

            channelMessage = await client.sendMessage(
                currentConfig.channelId,
                msg.body
            );

        }

        // ========================================
        // PESAN DENGAN MEDIA
        // ========================================
        else {

            console.log("----------------------------------------");
            console.log("MEDIA DEBUG");
            console.log("TYPE          :", msg.type);
            console.log("_serialized   :", msg.id?._serialized);
            console.log("$1            :", msg.id?.$1);
            console.log("AUTHOR        :", msg.author);
            console.log("----------------------------------------");

            const media = await downloadMediaWithRetry(msg, 3);

            if (!media) {
                console.error("Media gagal diunduh. Forward dibatalkan.");

                try {
                    await msg.reply(
                        "Forward gagal dilakukan karena media gagal diunduh."
                    );
                } catch (replyError) {
                    console.error("Gagal mengirim balasan:", replyError);
                }

                return;
            }

            channelMessage = await client.sendMessage(
                currentConfig.channelId,
                media,
                {
                    caption: msg.body || ""
                }
            );
        }

        // ========================================
        // VALIDASI HASIL FORWARD
        // ========================================
        if (!channelMessage) {
            console.error("Forward gagal: channelMessage kosong.");
            return;
        }

        if (!channelMessage) {
            console.error("Forward gagal: channelMessage kosong.");
            return;
        }

        // Reply pesan asli setelah berhasil dikirim
        try {
            await msg.reply("Info berhasil di forward menuju channel");
        } catch (replyError) {
            console.error(
                "Forward berhasil, tetapi gagal mengirim balasan:",
                replyError
            );
        }

        // ========================================
        // SIMPAN KE CACHE
        // ========================================
        messageCache.saveMessage(
            msg.id._serialized || msg.id.$1,
            channelMessage
        );

        // ========================================
        // SIMPAN MAPPING KE DATABASE
        // ========================================
        storage.saveMessage({
            groupMessageId: msg.id._serialized || msg.id.$1,
            channelMessageId: channelMessage.id._serialized,
            groupId: msg.from,
            channelId: currentConfig.channelId,
            createdAt: new Date().toISOString()
        });

        console.log("-----------------------------------");
        console.log("Message berhasil diforward.");
        console.log("Message berhasil disimpan ke cache.");
        console.log("Mapping berhasil disimpan ke database.");
        console.log("-----------------------------------");

    } catch (error) {

        console.error("========================================");
        console.error("FORWARD ERROR");
        console.error("----------------------------------------");
        console.error(error?.stack || error);
        console.error("========================================");

    }

};