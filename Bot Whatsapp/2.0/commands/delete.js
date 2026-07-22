const storage = require("../services/storage");
const messageCache = require("../services/messageCache");

module.exports = async (client, msg) => {

    console.log("========================================");
    console.log("DELETE MESSAGE");
    console.log("----------------------------------------");

    const mapping = storage.findMessage(msg.id._serialized);

    if (!mapping) {
        console.log("Pesan tidak ditemukan di database.");
        return;
    }

    const channelMessage = messageCache.getMessage(
        msg.id._serialized
    );

    if (!channelMessage) {
        console.log("Pesan tidak ditemukan di cache.");
        console.log("Kemungkinan bot sudah direstart.");
        return;
    }

    try {

        await channelMessage.delete(true);

        console.log("Pesan berhasil dihapus dari channel.");

        messageCache.deleteMessage(
            msg.id._serialized
        );

        storage.deleteMessage(
            msg.id._serialized
        );

        console.log("Cache berhasil dihapus.");
        console.log("Database berhasil dihapus.");

    } catch (err) {

        console.error("Gagal menghapus pesan.");
        console.error(err);

    }

    console.log("========================================");

};