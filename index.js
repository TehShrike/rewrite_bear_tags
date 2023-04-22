const db_path = `/Users/joshduff/Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite`

const util = require(`node:util`)
const exec = util.promisify(require(`node:child_process`).exec)
const sqlite3 = require(`sqlite3`)
const { open } = require(`sqlite`)

const main = async() => {
	const db = await open({
		filename: db_path,
		driver: sqlite3.Database,
	})

	const notes = await db.all(`
		SELECT ZUNIQUEIDENTIFIER AS id, ZTEXT AS note_text
		FROM ZSFNOTE
	`)

	await Promise.all(notes.filter(({ note_text }) => /#day\/\d{4}-\d{2}-\d{2}\b/.test(note_text)).map(async({ id, note_text }) => {
		const new_text = note_text.replaceAll(
			/#day\/(\d{4})-(\d{2})-(\d{2})\b/g,
			(_, year, month, day) => `#day/${year}/${month}/${day}`,
		)

		// console.log(`🔥writing:`, new_text, `❌`)

		await overwrite_text({
			id,
			text: new_text,
		})
	}))

	console.log(`Updated`, notes.length, `notes`)
}

main()

const shell_open = url => exec(`open "${ url }"`)

const build_url = (route, options) => `bear://x-callback-url/${ route }?`
	+ Object.entries(options).map(([ name, value ]) => `${ name }=${ encodeURIComponent(value) }`).join(`&`)

const overwrite_text = ({ id, text }) => {
	const url = build_url(`add-text`, {
		id,
		mode: `replace_all`,
		open_note: `no`,
		show_window: `no`,
		text,
	})

	shell_open(url)
}
