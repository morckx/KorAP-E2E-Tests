const puppeteer = require('puppeteer')
const chai = require('chai');
const assert = chai.assert;
const should = chai.should();

const KORAP_URL = process.env.KORAP_URL || "http://localhost:64543";
const KORAP_LOGIN = 'KORAP_LOGIN' in process.env ? process.env.KORAP_LOGIN : "user2"
const KORAP_PWD = process.env.KORAP_PWD || "password2";
const KORAP_QUERIES = 'geht, [orth=geht & cmc/pos=VVFIN]'
const korap_rc = require('../lib/korap_rc.js').new(KORAP_URL)

function ifConditionIt(title, condition, test) {
    return condition ? it(title, test) : it.skip(title + " (skipped)", test)
}

describe('Running KorAP UI end-to-end tests on ' + KORAP_URL, () => {

    before(async () => {
        browser = await puppeteer.launch()
        page = await browser.newPage()
    })

    after(async () => {
        await browser.close()
    })

    it('KorAP UI is up and running',
        (async () => {
            await await page.goto(KORAP_URL);
            const query_field = await page.$("#q-field")
            assert.isNotNull(query_field, "#q-field not found. Kalamar not running?");
        }))


    ifConditionIt('Login into KorAP with incorrect credentials fails',
        KORAP_LOGIN != "",
        (async () => {
            const login_result = await korap_rc.login(page, KORAP_LOGIN, KORAP_PWD + "*")
            login_result.should.be.false
        }))

    ifConditionIt('Login into KorAP with correct credentials succeeds',
        KORAP_LOGIN != "",
        (async () => {
            const login_result = await korap_rc.login(page, KORAP_LOGIN, KORAP_PWD)
            login_result.should.be.true
        }))

    it('Can turn glimpse off',
        (async () => {
            await korap_rc.assure_glimpse_off(page)
        }))

    describe('Running searches that should have hits', () => {

        before(async () => { await korap_rc.login(page, KORAP_LOGIN, KORAP_PWD) })

        KORAP_QUERIES.split(/[;,] */).forEach((query, i) => {
            it('Search for "' + query + '" has hits',
                (async () => {
                    await korap_rc.assure_glimpse_off(page)
                    const hits = await korap_rc.search(page, query)
                    hits.should.be.above(0)
                })).timeout(20000)
        })
    })

    ifConditionIt('Logout works',
        KORAP_LOGIN != "",
        (async () => {
            const logout_result = await korap_rc.logout(page)
            logout_result.should.be.true
        }))

})
