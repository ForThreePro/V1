import axios from "axios";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "@whiskeysockets/baileys";
import { getPlugins } from "../../core/pluginLoader.js";
import { db } from "../../database/db.js";
import config from "../../config.js";

let bannerCache = null
let bannerCacheTime = 0
let mediaCache = null
let mediaCacheTime = 0
let lastUsedUrl = null

async function getBuffer(url) {
  try {
    const res = await axios({ method: "get", url, responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando imagen: ${e.message}`);
  }
}
async function getBannerBuffer(url) {
  if (bannerCache && lastUsedUrl === url && Date.now() - bannerCacheTime < 3600000) return bannerCache
  bannerCache = await getBuffer(url)
  bannerCacheTime = Date.now()
  lastUsedUrl = url
  return bannerCache
}

const catNombres = {
  "info": "📊 INFO",
  "misc": "🎲 MISC",
  "dl": "📥 DOWNLOAD",
  "grupos": "👥 GROUP",
  "owner": "👑 OWNER",
  "utils": "⚡ UTILS",
  "stickers": "🎨 STICKERS",
  "sockets": "🔌 SOCKETS",
  "ia": "🧠 AI",
  "economy": "💰 ECONOMY",
  "anime": "🌸 ANIME",
}

const catDescripciones = {
  "info": "🤖 𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚌𝚒𝚘𝚗 𝚍𝚎𝚕 𝚜𝚒𝚜𝚝𝚎𝚖𝚊",
  "misc": "✨ 𝙵𝚞𝚗𝚌𝚒𝚘𝚗𝚎𝚜 𝚟𝚊𝚛𝚒𝚊𝚍𝚊𝚜",
  "dl": "📡 𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚜 𝚢 𝚖𝚞𝚕𝚝𝚒𝚖𝚎𝚍𝚒𝚊",
  "grupos": "🛡️ 𝙰𝚍𝚖𝚒𝚗𝚒𝚜𝚝𝚛𝚊𝚌𝚒𝚘𝚗 𝚍𝚎 𝚐𝚛𝚞𝚙𝚘𝚜",
  "owner": "🔐 𝙲𝚘𝚖𝚊𝚗𝚍𝚘𝚜 𝚎𝚡𝚌𝚕𝚞𝚜𝚒𝚟𝚘𝚜",
  "utils": "🛠️ 𝙷𝚎𝚛𝚛𝚊𝚖𝚒𝚎𝚗𝚝𝚊𝚜 𝚞𝚝𝚒𝚕𝚎𝚜",
  "stickers": "🖼️ 𝙲𝚛𝚎𝚊𝚍𝚘𝚛 𝚍𝚎 𝚜𝚝𝚒𝚌𝚔𝚎𝚛𝚜",
  "sockets": "🌐 𝙲𝚘𝚗𝚎𝚡𝚒𝚘𝚗 𝚍𝚎 𝚜𝚞𝚋-𝚋𝚘𝚝𝚜",
  "ia": "🤯 𝙸𝚗𝚝𝚎𝚕𝚒𝚐𝚎𝚗𝚌𝚒𝚊 𝚊𝚛𝚝𝚒𝚏𝚒𝚌𝚒𝚊𝚕",
  "economy": "💎 𝚂𝚒𝚜𝚝𝚎𝚖𝚊 𝚎𝚌𝚘𝚗𝚘𝚖𝚒𝚌𝚘",
  "anime": "🎭 𝚁𝚎𝚊𝚌𝚌𝚒𝚘𝚗𝚎𝚜 𝚊𝚗𝚒𝚖𝚎",
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú del sistema.",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, msg }) {
    try {
      const lugar = isGroup? groupName : "💬 Chat Privado";

      const currentBotNum = sock.user?.id? sock.user.id.split('@')[0].split(':')[0].replace(/\D/g, '') : '';
      const currentBotJid = currentBotNum? `${currentBotNum}@s.whatsapp.net` : '';

      let botData = db.getBot(currentBotJid) || db.getBot('main');

      const esLabelAutomatico = botData?.label?.startsWith('SUB_') || botData?.label === 'Subbot' || botData?.label === 'MAIN'
      const nombreBot = (esLabelAutomatico ||!botData?.label? config.botName : botData.label).replace(/@\d+/g, '').trim();

      const urlFoto = botData?.banner || "https://files.evogb.win/1oU31I.jpg";

      const esVerdaderoMain = botData?.isMain === true || botData?.isMain === 1;
      const tipoBot = esVerdaderoMain? "🤖 BOT PRINCIPAL" : "👾 SUB-BOT";

      const linkMatch = "https://mancosyasociados.kesug.com";

      const esOwnerOCoOwner = config.ownerNumber?.includes(senderNum) || config.coOwners?.includes(senderNum)

      const plugins = getPlugins()
      const categories = {}

      for (const [, plugin] of plugins) {
        const cat = plugin.category || "misc"
        if (cat === "owner" &&!esOwnerOCoOwner) continue
        if (!categories[cat]) categories[cat] = new Set()
        const names = Array.isArray(plugin.name)? plugin.name : [plugin.name]
        categories[cat].add(names[0])
      }

      let textoMenu = `┏━━━━━━━━━━━━━━━━━━━┓\n`;
      textoMenu += `┃ 🌐 𝚂𝚈𝚂𝚃𝙴𝙼 𝙾𝙽𝙻𝙸𝙽𝙴 🌐 ┃\n`;
      textoMenu += `┗━━━━━━━━━━━━━━━━━━━┛\n\n`;
      textoMenu += `👋 *𝙷𝚘𝚕𝚊 @${senderNum}* \n`;
      textoMenu += `🤖 *𝚂𝚘𝚢:* ${nombreBot}\n\n`;
      textoMenu += `╭─「 📡 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸𝙾𝙽 」─╮\n`;
      textoMenu += `│ ⚡ 𝚃𝚒𝚙𝚘: ${tipoBot}\n`;
      textoMenu += `│ 📱 𝚂𝚒𝚜𝚝𝚎𝚖𝚊: Android\n`;
      textoMenu += `│ 📍 𝙻𝚞𝚐𝚊𝚛: ${lugar}\n`;
      textoMenu += `│ 🔗 𝚄𝚁𝙻: ${linkMatch}\n`;
      textoMenu += `╰───────────────────╯\n\n`;

      for (const [cat, cmds] of Object.entries(categories)) {
        const categoriaLimped = cat.toLowerCase().trim();
        const nombreFormateado = catNombres[categoriaLimped] || `📦 ${categoriaLimped.toUpperCase()}`;
        const descripcion = catDescripciones[categoriaLimped] || "📦 𝙲𝚘𝚖𝚊𝚗𝚍𝚘𝚜";

        textoMenu += `┌──「 ${nombreFormateado} 」──\n`;
        textoMenu += `│ ${descripcion}\n`;
        textoMenu += `│\n`;

        for (const cmd of cmds) {
          textoMenu += `│ ➤ 🔹 ${usedPrefix}${cmd}\n`;
        }

        textoMenu += `└───────────────────\n\n`;
      }

      textoMenu += `╭──「 ⚙️ 𝙲𝚁𝙴𝙳𝙸𝚃𝙾𝚂 」──╮\n`;
      textoMenu += `│ 👨‍💻 𝙳𝚎𝚟: DuarteXV\n`;
      textoMenu += `│ 🚀 𝚅𝚎𝚛𝚜𝚒𝚘𝚗: Cyber v2.1\n`;
      textoMenu += `│ 💙 𝙶𝚛𝚊𝚌𝚒𝚊𝚜 𝚙𝚘𝚛 𝚞𝚜𝚊𝚛𝚖𝚎\n`;
      textoMenu += `╰───────────────────╯\n`;
      textoMenu += `\n🔗 ${linkMatch}`;

      let imgBanner
      if (mediaCache && lastUsedUrl === urlFoto && Date.now() - mediaCacheTime < 3600000) {
        imgBanner = mediaCache
      } else {
        const bufferBanner = await getBannerBuffer(urlFoto)
        const mediaBanner = await prepareWAMessageMedia(
          { image: bufferBanner },
          { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
        )
        imgBanner = mediaBanner.imageMessage
        mediaCache = imgBanner
        mediaCacheTime = Date.now()
      }

      const getTs = (ts) => typeof ts === "object"? Number(ts.low || ts) : Number(ts);

      const content = {
        extendedTextMessage: {
          endCardTiles: [],
          text: textoMenu,
          matchedText: linkMatch,
          canonicalUrl: linkMatch,
          description: `🤖 Cyber Bot System | Powered by DuarteXV`,
          title: `🤖 ${nombreBot.toUpperCase()} SYSTEM`,
          previewType: 0,
          jpegThumbnail: imgBanner.jpegThumbnail,
          thumbnailDirectPath: imgBanner.directPath,
          thumbnailSha256: imgBanner.fileSha256,
          thumbnailEncSha256: imgBanner.fileEncSha256,
          mediaKey: imgBanner.mediaKey,
          mediaKeyTimestamp: getTs(imgBanner.mediaKeyTimestamp),
          thumbnailHeight: imgBanner.height || 1080,
          thumbnailWidth: imgBanner.width || 1920,
          inviteLinkGroupTypeV2: 0,
          contextInfo: {
            mentionedJid: [`${senderNum}@s.whatsapp.net`],
            isForwarded: true,
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363420979328566@newsletter",
              newsletterName: "🤖 𝙲𝚈𝙱𝙴𝚁 𝙱𝙾𝚃 │ 𝙽𝙴𝚃𝚆𝙾𝚁𝙺 ⚡",
              serverMessageId: -1
            }
          }
        }
      };

      const waMsg = generateWAMessageFromContent(from, content, { userJid: sock.user?.id, quoted: msg })
      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id })

    } catch (error) {
      console.error("Error crítico en el comando menu:", error);
    }
  }
};