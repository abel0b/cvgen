const fs = require("fs-extra")
const path = require("path")
const yaml = require("js-yaml")
const ejs = require("ejs")

const INPUT_DIR = path.join(__dirname, 'input')
const OUTPUT_DIR = path.join(__dirname, 'output')
const TEMPLATE_DIR = path.join(__dirname, 'template')
const LANG_DIR = path.join(__dirname, 'lang')

async function generateCv(template, filename) {
    const name = filename.match(/^(.*)\.[a-zA-Z]*$/)[1]
    const filepath = path.join(INPUT_DIR, filename)
    console.log(`+ input file ${filepath}`)
    const config = yaml.safeLoad(await fs.readFile(filepath, "utf-8"))
    const out = path.join(OUTPUT_DIR, `${new Date().getTime()}_${name}`)
    await fs.copy(TEMPLATE_DIR, out)
    const lang = yaml.safeLoad(await fs.readFile(path.join(LANG_DIR, `${config.lang || "en"}.yaml`), "utf-8"))
    const generated = template({
        photo: false,
        first_name: "\\[first\\_name\\]",
        last_name: "\\[last\\_name\\]",
        number: "\\[number\\]",
        title: "\\[title\\]",
        email: "\\[email\\]",
        birth_date: "\\[birth\\_date\\]",
        website: "\\[website\\]",
        experience: {},
        projects: {},
        education: {},
        skills: {},
        ...config,
        lang,
    })
    await fs.writeFile(path.join(out, "index.tex"), generated)
    console.log(`+ output directory ${out}`)
}

async function main() {
    const filenames = await fs.readdir(INPUT_DIR)
    await fs.ensureDir(OUTPUT_DIR)

    const template = ejs.compile(
        await fs.readFile(path.join(TEMPLATE_DIR, "index.tex"), "utf-8")
    )

    for (let filename of filenames) {
        await generateCv(template, filename)
    }
}

main().catch(e => console.error(e))