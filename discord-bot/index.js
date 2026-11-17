import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";

const {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_ROLES = ["Direzione", "Responsabili"];

const commands = [
  new SlashCommandBuilder()
    .setName("lobby-attive")
    .setDescription("Mostra tutte le stanze live attive su Vexora"),
  new SlashCommandBuilder()
    .setName("chiudi-lobby")
    .setDescription("Chiude forzatamente una lobby tramite codice o ID")
    .addStringOption((opt) =>
      opt
        .setName("identificativo")
        .setDescription("Codice stanza (es. VX-123456) oppure UUID")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("cerca-utente")
    .setDescription("Cerca un profilo Vexora per username o ID")
    .addStringOption((opt) =>
      opt
        .setName("query")
        .setDescription("Username o UUID utente")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("ban-utente")
    .setDescription("Banna un utente Vexora tramite ID e chiude le sue stanze")
    .addStringOption((opt) =>
      opt.setName("user_id").setDescription("UUID Supabase dell'utente").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("motivo").setDescription("Motivo del ban").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("unban-utente")
    .setDescription("Rimuove il ban da un utente Vexora tramite ID")
    .addStringOption((opt) =>
      opt.setName("user_id").setDescription("UUID Supabase dell'utente").setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", async () => {
  console.log(`[Vexora Bot] Connesso come ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), {
    body: commands,
  });
  console.log("[Vexora Bot] Comandi slash registrati.");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const memberRoles = interaction.member?.roles?.cache;
  const hasPermission = memberRoles?.some((r) => ALLOWED_ROLES.includes(r.name));

  if (!hasPermission) {
    return interaction.reply({
      content: "Accesso negato: comando riservato a **Direzione** e **Responsabili**.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    if (interaction.commandName === "lobby-attive") {
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("id, code, title, category, type, is_private, owner:profiles!rooms_owner_id_fkey(username)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!rooms || rooms.length === 0) {
        return interaction.editReply("Nessuna lobby attiva al momento.");
      }

      const embed = new EmbedBuilder()
        .setTitle(`Vexora — Lobby Attive (${rooms.length})`)
        .setColor(0x5865f2)
        .setDescription(
          rooms
            .slice(0, 20)
            .map(
              (r) =>
                `• **${r.title}** (\`${r.code}\`) — ${r.category} | Host: \`${
                  r.owner?.username || "N/D"
                }\` ${r.is_private ? "[Privata]" : ""}`
            )
            .join("\n")
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (interaction.commandName === "chiudi-lobby") {
      const ident = interaction.options.getString("identificativo", true).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ident);

      const query = supabase.from("rooms").delete().select("code, title");
      const { data, error } = isUuid
        ? await query.eq("id", ident)
        : await query.eq("code", ident.toUpperCase());

      if (error) throw error;
      if (!data || data.length === 0) {
        return interaction.editReply(`Nessuna stanza trovata con identificativo \`${ident}\`.`);
      }

      return interaction.editReply(
        `Stanza **${data[0].title}** (\`${data[0].code}\`) chiusa correttamente.`
      );
    }

    if (interaction.commandName === "cerca-utente") {
      const q = interaction.options.getString("query", true).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);

      const query = supabase.from("profiles").select("*");
      const { data, error } = isUuid
        ? await query.eq("id", q).limit(1)
        : await query.ilike("username", `%${q}%`).limit(5);

      if (error) throw error;
      if (!data || data.length === 0) {
        return interaction.editReply(`Nessun utente trovato per \`${q}\`.`);
      }

      const embed = new EmbedBuilder()
        .setTitle("Risultati Ricerca Utente Vexora")
        .setColor(0x7c4dff)
        .addFields(
          data.map((u) => ({
            name: `${u.display_name || u.username} (@${u.username})`,
            value: `ID: \`${u.id}\`\nStato: \`${u.status}\` | Bannato: **${
              u.is_banned ? `SÌ (${u.ban_reason || "N/D"})` : "NO"
            }**`,
          }))
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (interaction.commandName === "ban-utente") {
      const userId = interaction.options.getString("user_id", true).trim();
      const motivo = interaction.options.getString("motivo", true).trim();

      const { data: user, error: banErr } = await supabase
        .from("profiles")
        .update({ is_banned: true, ban_reason: motivo, status: "offline" })
        .eq("id", userId)
        .select("username")
        .single();

      if (banErr || !user) {
        return interaction.editReply(`Utente \`${userId}\` non trovato.`);
      }

      const { data: closedRooms } = await supabase
        .from("rooms")
        .delete()
        .eq("owner_id", userId)
        .select("code");

      return interaction.editReply(
        `Utente **@${user.username}** (\`${userId}\`) bannato.\nMotivo: *${motivo}*\nStanze chiuse: **${
          closedRooms?.length || 0
        }**`
      );
    }

    if (interaction.commandName === "unban-utente") {
      const userId = interaction.options.getString("user_id", true).trim();

      const { data: user, error } = await supabase
        .from("profiles")
        .update({ is_banned: false, ban_reason: null })
        .eq("id", userId)
        .select("username")
        .single();

      if (error || !user) {
        return interaction.editReply(`Utente \`${userId}\` non trovato.`);
      }

      return interaction.editReply(
        `Ban rimosso per **@${user.username}** (\`${userId}\`).`
      );
    }
  } catch (err) {
    console.error(err);
    return interaction.editReply(`Errore operazione: ${err.message}`);
  }
});

client.login(DISCORD_TOKEN);
