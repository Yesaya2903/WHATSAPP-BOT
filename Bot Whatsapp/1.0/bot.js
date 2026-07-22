const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const SOURCE_GROUP_ID = '0987654321@g.us'; // Source Group ID 
// const SOURCE_GROUP_ID = '0987654321@g.us'; // Trial Group ID

const CHANNEL_ID = '1234567890@newsletter'; // Target Channel ID
// const CHANNEL_ID = '1234567890@newsletter'; // Trial Channel ID

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'your-client-id' // Ganti dengan ID unik untuk setiap instance
    })
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('====================');
    console.log('READY FOR USE');
    console.log('====================');
});

client.on('message', async (msg) => {
    try {

        // Abaikan chat selain grup
        if (!msg.from.endsWith('@g.us')) {
            return;
        }

        console.log('----------------');
        console.log('FROM      :', msg.from);
        console.log('AUTHOR    :', msg.author);
        console.log('TYPE      :', msg.type);
        console.log('BODY      :', msg.body);
        console.log('HAS MEDIA :', msg.hasMedia);

        // Hanya grup target
        if (msg.from !== SOURCE_GROUP_ID) {
            console.log('WRONG SOURCE GROUP');
            return;
        }

        console.log('TARGET MESSAGE');

        // Forward teks
        if (!msg.hasMedia) {

            if (msg.body && msg.body.trim()) {

                await client.sendMessage(
                    CHANNEL_ID,
                    msg.body
                );

                console.log('SENT');
            }

            return;
        }

        // Forward media
        console.log('DOWNLOAD MEDIA');

        const media = await msg.downloadMedia();

        if (!media) {
            console.log('DOWNLOAD FAILED');
            return;
        }

        await client.sendMessage(
            CHANNEL_ID,
            media,
            {
                caption: msg.body || ''
            }
        );

        console.log('TARGET MEDIA SENT');

    } catch (err) {
        console.error(err);
    }
});

client.initialize();