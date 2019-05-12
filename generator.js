const fs = require("fs-extra")
const path = require("path")
const yaml = require("js-yaml")
const ejs = require("ejs")
const util = require("util")
const exec = util.promisify(require('child_process').exec)

const INPUT_DIR = path.join(__dirname, 'input')
const OUTPUT_DIR = path.join(__dirname, 'output')
const PDF_DIR = path.join(OUTPUT_DIR, 'pdf')
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
        photo: true,
        first_name: "@first\\_name",
        last_name: "@last\\_name",
        number: "@number",
        title: "@title",
        email: "@email",
        website: "@website",
        experience: {},
        projects: {},
        education: {},
        skills: {},
        ...config,
        lang,
    })
    await fs.writeFile(path.join(out, "index.tex"), generated)
    try {
        const {stdout, stderr} = await exec(`OUTPUT_DIR=${PDF_DIR} make -C ${out}`)
        console.log(stdout)
    }
    catch(e) {
        console.log(e.stdout)
        console.error(e.stderr)
        return
    }
    await fs.copy(path.join(out, "index.pdf"), path.join(PDF_DIR, `${name}.pdf`))
    console.log(`+ output directory ${out}`)
}

async function main() {
    const filenames = await fs.readdir(INPUT_DIR)
    await Promise.all([
        fs.ensureDir(OUTPUT_DIR),
        fs.ensureDir(PDF_DIR),
    ])

    const template = ejs.compile(
        await fs.readFile(path.join(TEMPLATE_DIR, "index.tex"), "utf-8")
    )

    for (let filename of filenames) {
        await generateCv(template, filename)
    }
}

main().catch(e => console.error(e))
