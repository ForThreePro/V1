let handler = async (m, { conn, usedPrefix, command }) => {
    // FIX 1: Si no detecta mention, que busque en quoted
    let who = m.mentionedJid && m.mentionedJid[0]? m.mentionedJid[0] : m.quoted? m.quoted.sender : null

    // ===== IMAGENES POR DEFECTO =====
    const IMG_CASAMIENTO = 'https://files.evogb.win/zu9HrE.jpg'
    const IMG_DIVORCIO = 'https://files.evogb.win/bftECK.jpg'

    global.db.data.users[m.sender] = global.db.data.users[m.sender] || { pareja: null }

    // FIX 2: Función para que salga AZUL
    const sendMedia = async (chat, url, caption, mentions) => {
        return conn.sendMessage(chat, {
            image: { url: url },
            caption: caption,
            mentions: mentions // AQUI ESTA LA CLAVE PARA QUE SALGA AZUL
        }, { quoted: m })
    }

    // ===== CASARSE =====
    if (command == 'marry' || command == 'casar') {
        if (!who) return m.reply(`💍 *Uso:* ${usedPrefix}marry @usuario\n*Etiqueta a alguien para proponerle*\n\n*O responde a su mensaje y pon* ${usedPrefix}marry`)

        if (who === m.sender) return m.reply('🙄 *No te puedes casar contigo mismo xd*')

        global.db.data.users[who] = global.db.data.users[who] || { pareja: null }
        let user = global.db.data.users[m.sender]
        let target = global.db.data.users[who]

        if (user.pareja) {
            let exName = await conn.getName(user.pareja)
            return m.reply(`💍 *Ya estás casado con @${exName}*\n*Usa ${usedPrefix}divorcio primero*`, null, { mentions: [user.pareja] })
        }
        if (target.pareja) {
            let nameTarget = await conn.getName(who)
            let ex2Name = await conn.getName(target.pareja)
            return m.reply(`💔 *@${nameTarget} ya tiene pareja con @${ex2Name}*`, null, { mentions: [who, target.pareja] })
        }

        // Casarlos
        user.pareja = who
        target.pareja = m.sender

        let fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })

        let name1 = await conn.getName(m.sender) // FIX 3: Agarra nombre real
        let name2 = await conn.getName(who)

        // FIX 4: En el caption pon @ sin numero para que pinte azul
        let caption = `ᯇ 💒 𝗠𝗔𝗧𝗥𝗜𝗠𝗢𝗡𝗜𝗢 💒 ୧

⤷ ┇ 𝗘𝗟 𝗔𝗠𝗢𝗥 𝗩𝗘𝗡𝗖𝗜𝗢 ：✿ 。

꒰ ◞⁺⊹ ．💖 *¡SE CASARON!* 💖

@${name1} ❤️ @${name2}

──愛 *𝗩𝗢𝗧𝗢𝗦* ╏ 💌
"Prometo amarte en las buenas, en las malas,
y en los días que el wifi falle"

──愛 *𝗗𝗘𝗧𝗔𝗟𝗘𝗦* ╏ 💍
📅 𝗙𝗲𝗰𝗵𝗮: ${fecha}
💬 *Que su amor dure más que la batería del cel*

> *¡Que vivan los novios!* 🎉💕`

        return sendMedia(m.chat, IMG_CASAMIENTO, caption, [m.sender, who]) // PASA LOS 2 JID AQUI
    }

    // ===== DIVORCIARSE =====
    if (command == 'divorcio' || command == 'divorce') {
        let user = global.db.data.users[m.sender]
        if (!user.pareja) return m.reply(`💔 *No tienes pareja*\n*Usa ${usedPrefix}marry @usuario*`)

        let pareja = user.pareja
        if (!global.db.data.users[pareja] || global.db.data.users[pareja].pareja!== m.sender) {
            user.pareja = null // Arregla DB corrupta
            return m.reply(`⚠️ *DB reparada. Intenta de nuevo*`)
        }

        // Divorcio
        user.pareja = null
        global.db.data.users[pareja].pareja = null

        let name1 = await conn.getName(m.sender)
        let name2 = await conn.getName(pareja)

        let caption = `ᯇ 💔 𝗗𝗜𝗩𝗢𝗥𝗖𝗜𝗢 💔 ୧

⤷ ┇ 𝗙𝗜𝗡𝗔𝗟 𝗗𝗘𝗟 𝗔𝗠𝗢𝗥 ：✿ 。

꒰ ◞⁺⊹ ．😭 *SE ACABÓ* 😭

@${name1} 💔 @${name2}

──愛 *𝗖𝗔𝗥𝗧𝗔* ╏ 💌
"Ya no fue... pero gracias por los memes"
"El amor es como el internet: a veces se cae"

──愛 *𝗗𝗘𝗧𝗔𝗟𝗘𝗦* ╏ 📝
*División de bienes:* El que llore último paga el wifi

> *Ahora son libres* 🕊️ *A rehacer su vida*`

        return sendMedia(m.chat, IMG_DIVORCIO, caption, [m.sender, pareja])
    }
}

handler.help = ['marry @usuario', 'divorcio']
handler.tags = ['fun']
handler.command = /^(marry|casar|divorcio|divorce)$/i
handler.group = true

export default handler