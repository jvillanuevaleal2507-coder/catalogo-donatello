'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const url = 'https://catalogo.ventasdonatello.com/';

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try {
    const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
    assert.equal(response.status(),200,'homepage HTTP status');
    await page.getByRole('link',{name:'Productos',exact:true}).first().click();
    await page.locator('.product-card').first().waitFor({timeout:40000});
    const n=await page.locator('.product-card').count();
    assert.ok(n>0,'At least one real product rendered');
    await page.locator('.product-card').first().scrollIntoViewIfNeeded();
    await page.locator('.donatello-heart-card').first().click();
    await page.locator('.donatello-favorites-fab').click();
    await page.locator('.donatello-favorites-drawer.drawer-open, #donatello-favorites-root.drawer-open .donatello-favorites-drawer').waitFor({timeout:10000});
    const favoriteCount=await page.locator('.donatello-favorite-item').count();
    assert.equal(favoriteCount,1,'Favorite added and displayed');
    const title=await page.title();
    assert.match(title,/Donatello/i);
    const whatsapp=await page.locator('a[href^="https://wa.me/528999122313"]').count();
    assert.ok(whatsapp>0,'WhatsApp checkout/contact link present');
    assert.equal(errors.length,0,'No uncaught JS runtime error: '+errors.join('; '));
    console.log('CATALOG_PRODUCTION_SMOKE_PASS '+JSON.stringify({status:response.status(),title,products:n,favorites:favoriteCount,whatsappLinks:whatsapp}));
  } finally {
    await page.close();await browser.close();
  }
})().catch(error=>{console.error('CATALOG_PRODUCTION_SMOKE_FAIL',error.stack||String(error));process.exitCode=1;});
