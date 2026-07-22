const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

const commandHandler = require("./commands/handler");
const forwardCommand = require("./commands/forward");

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "forward-bot"
    }),
});


function getConfig() {
    return JSON.parse(
        fs.readFileSync("./config/config.json", "utf8")
    );
}


client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});


client.on("ready", async () => {

    console.log("====================");
    console.log("WES ISOK DIGAWE");
    console.log("====================");

    const result = await client.pupPage.evaluate(() => {

        const cmd = window.require("WAWebCmd");

        return {
            cmdKeys: Object.keys(cmd.Cmd),
            cmdImplKeys: Object.keys(cmd.CmdImpl),
            revokeKeys: Object.keys(cmd.Revoke)
        };

    });

    console.dir(result, { depth: null });

});


client.on("message", async (msg) => {

    try {

        console.log("====================");
        console.log("PESAN MASUK");
        console.log("FROM      :", msg.from);
        console.log("FROM ME   :", msg.fromMe);
        console.log("BODY      :", msg.body);
        console.log("====================");


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
            !msg.body.startsWith("/")
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


            console.log(
                "AUTO FORWARD BERHASIL"
            );

        }


    } catch (err) {

        console.error(err);

    }

});


client.initialize();