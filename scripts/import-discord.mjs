/**
 * Importa capítulos exportados do Discord (DiscordChatExporter HTML) para o LoxiHub.
 *
 * Uso:
 *   $env:SUPABASE_SERVICE_KEY="sua_chave_service_role"
 *   node scripts/import-discord.mjs
 *
 * A chave service_role está em: Supabase Dashboard → Project Settings → API → service_role
 */

import { readFileSync, readdirSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const DOCS_DIR = 'C:/Users/nanda/OneDrive/Documentos'
const SUPABASE_URL = 'https://srdssrpnggoryakevefw.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('\n❌ Defina a variável SUPABASE_SERVICE_KEY antes de rodar:')
  console.error('   $env:SUPABASE_SERVICE_KEY="eyJ..."')
  console.error('   node scripts/import-discord.mjs\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ROMAN = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7,
  viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15,
}

// Converte HTML do Discord → texto com markdown do LoxiHub
function htmlToMarkdown(html) {
  return html
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<u>([\s\S]*?)<\/u>/gi, '__$1__')
    .replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~')
    .replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function extractChapterLabel(filename) {
  const match = filename.match(/- ([ivxlcdm]+) \[/i)
  return match ? match[1].toLowerCase() : null
}

function parseHtmlFile(filepath) {
  const raw = readFileSync(filepath, 'utf-8')
  const messages = []

  // Quebra por grupos de mensagem
  const groups = raw.split(/(?=<div class=chatlog__message-group>)/)

  for (const group of groups) {
    // Autor do grupo (aparece só no primeiro header do grupo)
    const authorMatch = group.match(/class=chatlog__author title="([^"]+)"/)
    if (!authorMatch) continue
    const author = authorMatch[1].toLowerCase().trim()

    // Todos os conteúdos de mensagem dentro deste grupo
    const contentRegex = /<span class=chatlog__markdown-preserve>([\s\S]*?)<\/span>/g
    let m
    while ((m = contentRegex.exec(group)) !== null) {
      const text = htmlToMarkdown(m[1])
      if (text.length > 0) {
        messages.push({ author, content: text })
      }
    }
  }

  return messages
}

async function main() {
  // Busca personagens cadastrados no banco
  const { data: personagens, error: pErr } = await supabase
    .from('personagens')
    .select('id, nome')
  if (pErr) {
    console.error('❌ Erro ao buscar personagens:', pErr.message)
    process.exit(1)
  }
  console.log('\n👥 Personagens no banco:')
  personagens.forEach(p => console.log(`   • ${p.nome}`))

  // Faz match do nome do Discord → nome exato do personagem (case-insensitive)
  function resolveNome(discordName) {
    const first = discordName.split(' ')[0] // ex: "effie" de "effie hawthorne"
    const match = personagens.find(p =>
      p.nome.toLowerCase().includes(first.toLowerCase())
    )
    return match?.nome ?? discordName
  }

  // Busca o ID do usuário dono da conta
  const { data: usersData, error: uErr } = await supabase.auth.admin.listUsers()
  if (uErr) {
    console.error('❌ Erro ao buscar usuários:', uErr.message)
    process.exit(1)
  }
  const userId = usersData?.users?.[0]?.id ?? null
  console.log(`\n🔑 Usuário: ${usersData?.users?.[0]?.email} (${userId})`)

  // Lista e ordena os arquivos HTML por número de capítulo
  const allFiles = readdirSync(DOCS_DIR).filter(f =>
    f.endsWith('.html') && f.toLowerCase().includes('hawthorne')
  )
  allFiles.sort((a, b) => {
    const na = ROMAN[extractChapterLabel(a)] ?? 0
    const nb = ROMAN[extractChapterLabel(b)] ?? 0
    return na - nb
  })

  if (allFiles.length === 0) {
    console.error(`\n❌ Nenhum arquivo HTML encontrado em: ${DOCS_DIR}`)
    process.exit(1)
  }

  console.log(`\n📚 ${allFiles.length} capítulos encontrados: ${allFiles.map(f => extractChapterLabel(f)).join(', ')}`)
  console.log('\n─────────────────────────────────────────')

  let totalPosts = 0

  for (const filename of allFiles) {
    const label = extractChapterLabel(filename)
    const titulo = `Capítulo ${label?.toUpperCase()}`

    console.log(`\n📖 ${titulo}`)

    const filepath = `${DOCS_DIR}/${filename}`
    let messages
    try {
      messages = parseHtmlFile(filepath)
    } catch (e) {
      console.error(`   ❌ Erro ao ler arquivo: ${e.message}`)
      continue
    }

    if (messages.length === 0) {
      console.log('   ⚠️  Nenhuma mensagem encontrada, pulando.')
      continue
    }

    // Mostra quem escreve e quantas vezes
    const counts = {}
    messages.forEach(m => { counts[m.author] = (counts[m.author] ?? 0) + 1 })
    Object.entries(counts).forEach(([author, count]) =>
      console.log(`   • ${resolveNome(author)}: ${count} posts`)
    )

    // Cria a thread
    const { data: thread, error: tErr } = await supabase
      .from('threads')
      .insert({
        titulo,
        status: 'concluida',
        tags: ['hawthorne'],
        criado_por: userId,
      })
      .select('id')
      .single()

    if (tErr) {
      console.error(`   ❌ Erro ao criar thread: ${tErr.message}`)
      continue
    }

    // Insere posts em ordem (um a um para preservar created_at em sequência)
    let postCount = 0
    for (const msg of messages) {
      const { error: postErr } = await supabase.from('posts').insert({
        thread_id: thread.id,
        conteudo: msg.content,
        personagem_pov: resolveNome(msg.author),
        criado_por: userId,
      })
      if (postErr) {
        console.error(`   ⚠️  Erro num post: ${postErr.message}`)
      } else {
        postCount++
      }
    }

    totalPosts += postCount
    console.log(`   ✅ ${postCount} posts importados → thread ${thread.id}`)
  }

  console.log('\n─────────────────────────────────────────')
  console.log(`\n🎉 Importação concluída!`)
  console.log(`   ${allFiles.length} capítulos | ${totalPosts} posts no total`)
  console.log(`\n   Acesse: http://localhost:3000/dashboard/threads\n`)
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message)
  process.exit(1)
})
