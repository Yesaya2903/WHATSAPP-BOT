const forwardCommand = require("./forward");
const deleteCommand = require("./delete");
const autoForwardCommand = require("./autoforward");

async function commandHandler(client, msg) {

    const body = msg.body.trim().toLowerCase();

    // ============================
    // FORWARD
    // ============================
    if (body === "/forward") {

        if (!msg.hasQuotedMsg) {
            await msg.reply(
                "⚠️ Reply pesan yang ingin di-forward."
            );
            return;
        }

        const quoted = await msg.getQuotedMessage();

        await forwardCommand(client, quoted);

        await msg.reply(
            "✅ Berhasil di-forward."
        );

        return;
    }

    // ============================
    // DELETE
    // ============================
    if (body === "/delete") {

        if (!msg.hasQuotedMsg) {
            await msg.reply(
                "⚠️ Reply pesan yang ingin dihapus."
            );
            return;
        }

        const quoted = await msg.getQuotedMessage();

        await deleteCommand(client, quoted);

        await msg.reply(
            "🗑️ Berhasil dihapus."
        );

        return;
    }

    // ============================
    // AUTO FORWARD
    // ============================
    if (
        body === "/autoforward" ||
        body === "/autoforward on" ||
        body === "/autoforward off"
    ) {

        await autoForwardCommand(client, msg);

        return;
    }

}

module.exports = commandHandler;