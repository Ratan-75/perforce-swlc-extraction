const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const objectsToCsv = require("objects-to-csv");

async function createCsvFile(data) {
    let csv = new objectsToCsv(data);
    await csv.toDisk("./perforce_data.csv", { allColumns: true });
}

const toPushList = [];

// const id_s = [26751, 37191, 26811, 26791, 37201, 26766, 26801];

const url ='https://www.perforce.com/maintenance-support#tab-panel-';

function formatDate(dateString) {
    if(dateString === "Current Version (under maintenance)"){
        return "";
    } else {
        let date = new Date(dateString);
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let day = date.getDate();
        return (year + '-' + ((month <= 9) ? ('0' + month) : month) + '-' + ((day <= 9) ? ('0' + day) : day));
    }
}

async function dataExtractor(page){
    await page.goto(url);
    const html = await page.content();
    const $ = cheerio.load(html);

    const regexForVersion = /(19|20)\d{2}|[0-9]*\.[0-9]|\d[]/g;

    const versionExtractor = input => {
        return input.match(regexForVersion).join('').toString();
    }

    const regexForProdName = /[A-Z][0-9][a-z]*|[A-Z][0-9]|[A-Z][0-9][A-Z]|[0-9][a-z]+|[A-Z][a-z]*/g;

    const prodNameExtractor = input => {
        return input.match(regexForProdName).join('').toString();
    }

    const tableElement = $("div.clearfix > table");
    const productNameElem = $("div.clearfix > h3");
    for(let i=0; i <= tableElement.length; i++){
        const specificTable = $(tableElement[i]).find("tbody > tr");
        for(let k = 1; k < specificTable.length; k++){
            const source_publisher = "Perforce Software";
            let name_version_data = $(specificTable[k]).find("td:nth-child(1)").text();
            const source_product = (i == 29 || i == 30) ? $(productNameElem[30]).text() : $(productNameElem[i]).text() 
            + ' / ' + prodNameExtractor(name_version_data);
            const source_full_version = versionExtractor(name_version_data);
            const source_availability = formatDate($(specificTable[k]).find("td:nth-child(2)").text());
            const source_end_of_support = formatDate($(specificTable[k]).find("td:nth-child(3)").text());
            const source_end_of_extended_support = formatDate($(specificTable[k]).find("td:nth-child(4)").text());
            const concatenated_source = [source_publisher, source_product, source_full_version].join(" - ");
            toPushList.push({
                concatenated_source,
                source_publisher,
                source_product,
                source_full_version,
                source_availability,
                source_end_of_support,
                source_end_of_extended_support
            });
        }
    }
}

async function main(){
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await dataExtractor(page);
    await browser.close();
    await createCsvFile(toPushList);
}

main();