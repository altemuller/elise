const { getHeroes, heroParse, heroSearch, wikiParse, getHeroesStatic } = require('./utils.js')
const { VK } = require('vk-io');

const vk = new VK({
	token: process.env.TOKEN,
	pollingGroupId: 159219251
});

const { updates } = vk;

updates.hear(/^(bot|elise)\s(\w+)/i, async (context) => {
	const heroVariations = await heroSearch(context.$match[2], getHeroesStatic());
    heroParse(heroVariations, 0, context);
});

updates.hear(/^wiki\s(\w+)\s(\w+)/i, async (context) => {
	wikiParse(context.$match[1], context.$match[2], context)
});

updates.hear(/^wiki\s(\w+)/i, async (context) => {
	wikiParse(context.$match[1], null, context)
});

async function run() {
	await getHeroes();
	await vk.updates.startPolling();
	setInterval(async () => {
		await getHeroes();
	}, 720000);
	console.log('Polling started');
}

run().catch(console.error);