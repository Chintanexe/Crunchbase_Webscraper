const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
var mysql = require("mysql")
var con = mysql.createConnection({
    host:"localhost",
    user :"chintan",
    password : "Chintan123@",
    database : "webscrape"
})
const EMAIL = "f20190874@goa.bits-pilani.ac.in"
const PASSWORD = "Arrowhead1"

// Enter the name of the companies in the input
let input = ['perplexity.ai'];
let output = [];
let failed = [];

puppeteer.use(StealthPlugin())

const url = "https://www.crunchbase.com/login";
const chromepath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const main = async() =>{
    const browser = await puppeteer.launch({headless: false, executablePath : chromepath})
    const page =await browser.newPage()
    await page.goto(url)
    await page.screenshot({path :'bot.jpg'})
    await page.waitForTimeout(1000)

    await page.type('input[autocomplete="email"]',EMAIL)
    await page.type('input[autocomplete="current-password"]',PASSWORD)
    await page.click('[type = submit]')

    await page.waitForTimeout(2000)
    let outputCount = 0;
    for (var k = 0; k < input.length; k++) {
        try {
            let cname = input[k].toLowerCase();
            cname = cname.replace(/[ .]/g, '-');
            await page.goto(`https://www.crunchbase.com/organization/${cname}`);
            await page.waitForTimeout(2000)
            const url = await page.url();

            await page.goto(`${url}/people`)
            await page.waitForTimeout(4000);
            const inputText = await page.$eval('.two-column.ng-star-inserted', e => e.innerText);
            
            const lines = inputText.split('\n');

            const names = [];
            for (let i = 0; i < lines.length; i += 2) {
            names.push(lines[i]);
            }

            const Executives = names.join(',');
            console.log(`Name of the Executives: ${Executives}`);

            await page.waitForTimeout(2000);
            console.log(`${url}/company_financials`);
            await page.goto(`${url}/company_financials`);
            await page.waitForTimeout(2000);
            let fundingText = await page.$eval('.one-of-many-section:nth-child(2)', e => e.innerText);
            console.log(fundingText);
            await page.waitForTimeout(2000);
            let totalFund = await page.$eval('.component--field-formatter.field-type-money.ng-star-inserted', (element) => {
                return element.textContent.trim();
            });
            const fundingCount =  await page.$eval('.component--field-formatter.field-type-integer.accent.highlight-color-contrast-light.ng-star-inserted', e => e.innerText);
            
            const fundingAvailable = fundingCount > 10 ? 10 : fundingCount
            for (var i = 1; i <= fundingAvailable; i++) {
                let fundingDate = await page.$eval(`.full-width:nth-child(5) tbody > .ng-star-inserted:nth-child(${i}) > .ng-star-inserted:nth-child(1)`, e => e.innerText);
                let fundingName = await page.$eval(`.full-width:nth-child(5) tbody > .ng-star-inserted:nth-child(${i}) > .ng-star-inserted:nth-child(2)`, e => e.innerText);
                let fundingType = fundingName.split('-')[0];
                let numberOfInvestors = await page.$eval(`.full-width:nth-child(5) tbody > .ng-star-inserted:nth-child(${i}) > .ng-star-inserted:nth-child(3)`, e => e.innerText);
                let moneyRaised = await page.$eval(`.full-width:nth-child(5) tbody > .ng-star-inserted:nth-child(${i}) > .ng-star-inserted:nth-child(4)`, e => e.innerText);
                
                let leadInvestor = await page.$eval(`.full-width:nth-child(5) tbody > .ng-star-inserted:nth-child(${i}) > .ng-star-inserted:nth-child(5)`, e => e.innerText);
                console.log(`${fundingDate} ${fundingName} ${fundingType} ${numberOfInvestors} ${moneyRaised} ${leadInvestor}`);
                let CompanyName = fundingName.split('-')[1]
                temp = [CompanyName,Executives ,fundingType,fundingDate,moneyRaised,totalFund,leadInvestor,numberOfInvestors]
                output.push(temp)
            
            }
            outputCount++;
        } catch (e) {
            failed.push(input[k]);
            console.log(`There was an error while serching for this Organisation: ${input[k]}`);
            console.error(e);
        }
    }
    await browser.close();
   
    console.log(`Output results: ${outputCount}, Failed results: ${failed.length}`);

    con.connect(function(err){
        if(err) throw err;
        console.log("MYSQL connected");
        var sql =`INSERT INTO funding (Company_Name ,Executives ,Funding_Type,Announced_Date,Money_Raised,Total_Funding_Raised ,Lead_Investor , Number_of_Investors) VALUES ?`;
        
            con.query(sql,[output],function(err,result){
                 if(err) throw err;
                console.log("records inserted:" + result.affectedRows)
            })

        console.log( "All items stored into database successfully"); 
        con.end((error) => {
            if (error) {
              console.error('Error closing MySQL connection:', error);
              return;
            }
            console.log('MySQL connection closed.');
          });    
    
    });
    
}

main()