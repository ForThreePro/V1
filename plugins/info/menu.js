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
  "info": "INFO",
  "misc": "MISC",
  "dl": "DOWNLOAD",
  "grupos": "GROUP",
  "owner": "OWNER",
  "utils": "UTILS",
  "stickers": "STICKERS",
  "sockets": "SOCKETS",
  "ia": "AI",
  "economy": "ECONOMY",
  "anime": "ANIME",
}

const catDescripciones = {
  "info": "◈ 𝚂𝚢𝚜𝚝𝚎𝚖 𝚒𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜",
  "misc": "◈ 𝙼𝚒𝚜𝚌𝚎𝚕𝚊𝚗𝚎𝚘𝚞𝚜 𝚏𝚞𝚗𝚌𝚝𝚒𝚘𝚗𝚜",
  "dl": "◈ 𝙵𝚒𝚕𝚎 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚖𝚘𝚍𝚞𝚕𝚎𝚜",
  "grupos": "◈ 𝙶𝚛𝚘𝚞𝚙 𝚖𝚊𝚗𝚊𝚐𝚎𝚖𝚎𝚗𝚝 𝚙𝚛𝚘𝚝𝚘𝚌𝚘𝚕𝚜",
  "owner": "◈ 𝙰𝚍𝚖𝚒𝚗 𝚊𝚌𝚌𝚎𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜",
  "utils": "◈ 𝚄𝚝𝚒𝚕𝚒𝚝𝚢 𝚝𝚘𝚘𝚕𝚜",
  "stickers": "◈ 𝚂𝚝𝚒𝚌𝚔𝚎𝚛 𝚌𝚛𝚎𝚊𝚝𝚒𝚘𝚗 𝚜𝚢𝚜𝚝𝚎𝚖",
  "sockets": "◈ 𝚂𝚞𝚋-𝚋𝚘𝚝 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚑𝚞𝚋",
  "ia": "◈ 𝙰𝚛𝚝𝚒𝚏𝚒𝚌𝚒𝚊𝚕 𝙸𝚗𝚝𝚎𝚕𝚒𝚐𝚎𝚗𝚌𝚎 𝚖𝚘𝚍𝚞𝚕𝚎",
  "economy": "◈ 𝚅𝚒𝚛𝚝𝚞𝚊𝚕 𝚎𝚌𝚘𝚗𝚘𝚖𝚢 𝚜𝚢𝚜𝚝𝚎𝚖",
  "anime": "◈ 𝙰𝚗𝚒𝚖𝚎 𝚛𝚎𝚊𝚌𝚝𝚒𝚘𝚗 𝚍𝚊𝚝𝚊𝚋𝚊𝚜𝚎",
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú del sistema.",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, msg }) {
    try {
      const lugar = isGroup? groupName : "Chat Privado";

      const currentBotNum = sock.user?.id? sock.user.id.split('@')[0].split(':')[0].replace(/\D/g, '') : '';
      const currentBotJid = currentBotNum? `${currentBotNum}@s.whatsapp.net` : '';

      let botData = db.getBot(currentBotJid) || db.getBot('main');

      const esLabelAutomatico = botData?.label?.startsWith('SUB_') || botData?.label === 'Subbot' || botData?.label === 'MAIN'
      const nombreBot = (esLabelAutomatico ||!botData?.label? config.botName : botData.label).replace(/@\d+/g, '').trim();

      const urlFoto = botData?.banner || "https://files.evogb.win/1oU31I.jpg";

      const esVerdaderoMain = botData?.isMain === true || botData?.isMain === 1;
      const tipoBot = esVerdaderoMain? "MAIN BOT" : "SUB-BOT";

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

      let textoMenu = `*《 𝚂𝚈𝚂𝚃𝙴𝙼 𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 》*\n`;
      textoMenu += `*𝚄𝚂𝙴𝚁:* @${senderNum}\n`;
      textoMenu += `*𝙱𝙾𝚃:* ${nombreBot}\n`;
      textoMenu += `╭─「 𝙲𝚈𝙱𝙴𝚁 𝙸𝙽𝙵𝙾 」─╮\n`;
      textoMenu += `│ ▸ 𝚃𝚈𝙿𝙴: ${tipoBot}\n`;
      textoMenu += `│ ▸ 𝙾𝚂: Android\n`;
      textoMenu += `│ ▸ 𝙻𝙾𝙲: ${lugar}\n`;
      textoMenu += `│ ▸ 𝚄𝚁𝙻: ${linkMatch}\n`;
      textoMenu += `╰────────────────╯\n\n`;

      for (const [cat, cmds] of Object.entries(categories)) {
        const categoriaLimped = cat.toLowerCase().trim();
        const nombreFormateado = catNombres[categoriaLimped] || categoriaLimped.toUpperCase();
        const descripcion = catDescripciones[categoriaLimped] || "◈ 𝙲𝚘𝚖𝚊𝚗𝚍𝚜";

        textoMenu += `┌───「 ${nombreFormateado} 」\n`;
        textoMenu += `│ ${descripcion}\n`;
        textoMenu += `│\n`;

        for (const cmd of cmds) {
          textoMenu += `│ ◉ ${usedPrefix}${cmd}\n`;
        }

        textoMenu += `└────────────────\n\n`;
      }

      textoMenu += `╭─「 𝙲𝙾𝙽𝙴𝙲𝚃𝙸𝙾𝙽 」─╮\n`;
      textoMenu += `│ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈: Whois\n`;
      textoMenu += `│ 𝚅𝙴𝚁𝚂𝙸𝙾𝙽: Cyber v2.0\n`;
      textoMenu += `╰─────────────────╯`;

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
          description: `Cyber Bot System | Powered by Whois`,
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
              newsletterName: "🤖 𝙲𝚈𝙱𝙴𝚁 𝙱𝙾𝚃 │ 𝙽𝙴𝚃𝚆𝙾𝚁𝙺",
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